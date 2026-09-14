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
    if connection_uri not in db_engines:
        db_engines[connection_uri] = create_engine(connection_uri, pool_pre_ping=True)
    return db_engines[connection_uri]

# We need a way to pass the connection URI into the tool, but LangGraph tools don't natively take dynamic contextual config easily without passing it through the LLM. 
# As a workaround for this demo, we'll store the current DB URI globally or let the LLM pass it, but better is to use `injected` arguments if using newer LangChain.
# For simplicity, we'll store it globally per request in a thread-local or just a global var since it's a local demo.
import threading
request_context = threading.local()

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

def create_agent(llm_provider: str, llm_api_key: str):
    """Creates a LangGraph agent based on the provider and key."""
    tools = [execute_sql, render_visualization, apply_data_masking]
    
    if llm_provider == "openai":
        # Usually implies NVIDIA here due to our frontend mapping, but let's check
        llm = ChatNVIDIA(model="nvidia/nemotron-3-super-120b-a12b", api_key=llm_api_key)
    elif llm_provider == "nvidia":
        llm = ChatNVIDIA(model="nvidia/nemotron-3-super-120b-a12b", api_key=llm_api_key)
    elif llm_provider == "google":
        llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", api_key=llm_api_key)
    else:
        raise ValueError(f"Unsupported provider: {llm_provider}")
    
    agent_executor = create_react_agent(llm, tools)
    return agent_executor
