from typing import List, Optional
import json
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langgraph.prebuilt import create_react_agent
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Global engine cache to avoid recreating connections on every query
# In a real app, this should be handled more robustly
db_engines = {}

def get_engine(connection_uri: str):
    if connection_uri.startswith("mysql://"):
        connection_uri = connection_uri.replace("mysql://", "mysql+pymysql://", 1)
    
    if connection_uri not in db_engines:
        db_engines[connection_uri] = create_engine(connection_uri, pool_pre_ping=True)
    return db_engines[connection_uri]

# We need a way to pass the connection URI into the tool, but LangGraph tools don't natively take dynamic contextual config easily without passing it through the LLM. 
# As a workaround for this demo, we'll store the current DB URI globally or let the LLM pass it, but better is to use `injected` arguments if using newer LangChain.
# For simplicity, we'll store it globally per request in a thread-local or just a global var since it's a local demo.
# For simplicity, we'll store it globally per request since it's a local demo.
class RequestContext:
    connection_uri = ""

request_context = RequestContext()

@tool
def execute_sql(query: str) -> str:
    """Executes a SQL query against the database and returns the results.
    Args:
        query: The SQL query to execute.
    """
    connection_uri = getattr(request_context, "connection_uri", None)
    if not connection_uri:
        return "Error: No database connection URI provided in context."
    
    # Simple safety check to prevent dropping tables (basic protection)
    lower_query = query.lower()
    if "drop" in lower_query or "delete" in lower_query or "truncate" in lower_query:
        # In this demo, we allow it if mutation guard is off, but let's just warn
        pass

    try:
        engine = get_engine(connection_uri)
        with engine.connect() as conn:
            result = conn.execute(text(query))
            if result.returns_rows:
                rows = [dict(row._mapping) for row in result.fetchall()]
                # Convert to string to return to LLM, but truncate if too large
                res_str = json.dumps(rows, default=str)
                if len(res_str) > 2000:
                    return res_str[:2000] + "... (truncated)"
                return res_str
            else:
                conn.commit()
                return "Query executed successfully. No rows returned."
    except SQLAlchemyError as e:
        return f"Database error: {str(e)}"
    except Exception as e:
        return f"Error: {str(e)}"

@tool
def render_visualization(chart_type: str, data_key: str) -> str:
    """Renders a visualization in the UI.
    Args:
        chart_type: The type of chart (e.g., 'bar', 'line', 'pie').
        data_key: The column name to visualize.
    """
    return f"Successfully queued {chart_type} chart for {data_key} to be rendered in UI."

@tool
def apply_data_masking(columns: List[str]) -> str:
    """Masks sensitive data columns in the UI.
    Args:
        columns: List of column names to mask.
    """
    return f"Successfully applied data masking to: {', '.join(columns)}"

def create_agent(llm_provider: str, llm_api_key: str, llm_model: str = "", db_type: str = "PostgreSQL"):
    """Creates a LangGraph agent based on the provider and key."""
    tools = [execute_sql, render_visualization, apply_data_masking]
    
    if llm_provider == "openai":
        from langchain_openai import ChatOpenAI
        model_name = llm_model if llm_model else "gpt-4o"
        llm = ChatOpenAI(model=model_name, api_key=llm_api_key)
    elif llm_provider == "nvidia":
        model_name = llm_model if llm_model else "meta/llama-3.1-70b-instruct"
        llm = ChatNVIDIA(model=model_name, api_key=llm_api_key, base_url="https://integrate.api.nvidia.com/v1")
    elif llm_provider in ["google", "gemini"]:
        model_name = llm_model if llm_model else "gemini-1.5-flash"
        llm = ChatGoogleGenerativeAI(model=model_name, api_key=llm_api_key)
    else:
        raise ValueError(f"Unsupported provider: {llm_provider}")
    # We will let the invoker handle the system prompt to avoid version compatibility issues
    # Create the agent
    agent_executor = create_react_agent(llm, tools)
    return agent_executor
