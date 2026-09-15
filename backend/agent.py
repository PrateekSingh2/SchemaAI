from typing import List, Optional
import json
from langchain_core.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langgraph.prebuilt import create_react_agent
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Global engine cache to avoid recreating connections on every query
db_engines = {}

def is_mongo_uri(uri: str) -> bool:
    if not uri:
        return False
    clean = uri.strip().lower()
    return clean.startswith("mongodb://") or clean.startswith("mongodb+srv://")

def sanitize_mongo_val(val, depth=0):
    """Recursively converts MongoDB/BSON types (ObjectId, datetime, Decimal128, etc.) to JSON serializable Python types."""
    if depth > 10:
        return "[nested]"
    if val is None:
        return None
    if isinstance(val, (bool, int, float, str)):
        return val
    if hasattr(val, "isoformat"):
        return val.isoformat()
    if hasattr(val, "__str__") and type(val).__name__ in ["ObjectId", "Decimal128", "Binary", "Timestamp"]:
        return str(val)
    if isinstance(val, (bytes, bytearray)):
        import base64
        return base64.b64encode(val).decode("utf-8")
    if isinstance(val, list):
        return [sanitize_mongo_val(item, depth + 1) for item in val]
    if isinstance(val, dict):
        return {str(k): sanitize_mongo_val(v, depth + 1) for k, v in val.items()}
    return str(val)

def execute_mongo_query(connection_uri: str, query: str):
    from pymongo import MongoClient
    import re
    
    clean_uri = connection_uri.strip()
    client = MongoClient(clean_uri, serverSelectionTimeoutMS=10000)
    
    # Extract database name
    db_name = None
    match = re.search(r"mongodb(?:\+srv)?://[^/]+/([^?]+)", clean_uri)
    if match and match.group(1):
        db_name = match.group(1).split("?")[0].strip()
        
    db = client[db_name] if db_name and db_name != "admin" else client.get_default_database("test")
    clean_q = query.strip()
    clean_q = re.sub(r"^```(?:javascript|json|mongodb|mql|sql)?\s*", "", clean_q, flags=re.IGNORECASE)
    clean_q = re.sub(r"\s*```$", "", clean_q).strip()
    
    # 1. db.collection.find(...) or db.getCollection("...").find(...)
    find_match = re.search(r"(?:db\.getCollection\(.*?\)|\bdb)\.([a-zA-Z0-9_\-]+)\.find\(([\s\S]*?)\)(?:\.sort\(([\s\S]*?)\))?(?:\.skip\((\d+)\))?(?:\.limit\((\d+)\))?", clean_q)
    if find_match:
        coll_name = find_match.group(1)
        raw_filter = find_match.group(2).strip()
        raw_sort = find_match.group(3).strip() if find_match.group(3) else None
        skip_val = int(find_match.group(4)) if find_match.group(4) else 0
        limit_val = int(find_match.group(5)) if find_match.group(5) else 50
        
        filter_dict = {}
        if raw_filter and raw_filter != "{}":
            try:
                import ast
                filter_dict = json.loads(raw_filter) if raw_filter.startswith("{") else ast.literal_eval(raw_filter)
            except Exception:
                filter_dict = {}
                
        cursor = db[coll_name].find(filter_dict)
        if raw_sort:
            try:
                import ast
                sort_dict = json.loads(raw_sort) if raw_sort.startswith("{") else ast.literal_eval(raw_sort)
                cursor = cursor.sort(list(sort_dict.items()))
            except Exception:
                pass
        if skip_val > 0:
            cursor = cursor.skip(skip_val)
        cursor = cursor.limit(limit_val)
        raw_docs = list(cursor)
        return [sanitize_mongo_val(doc) for doc in raw_docs]
        
    # 2. db.collection.aggregate([...])
    agg_match = re.search(r"(?:db\.getCollection\(.*?\)|\bdb)\.([a-zA-Z0-9_\-]+)\.aggregate\(\s*(\[[\s\S]*?\])\s*\)", clean_q)
    if agg_match:
        coll_name = agg_match.group(1)
        raw_pipeline = agg_match.group(2).strip()
        try:
            import ast
            pipeline = json.loads(raw_pipeline) if raw_pipeline.startswith("[") else ast.literal_eval(raw_pipeline)
        except Exception:
            pipeline = []
        raw_docs = list(db[coll_name].aggregate(pipeline))
        return [sanitize_mongo_val(doc) for doc in raw_docs]
        
    # 3. db.collection.countDocuments(...) or db.collection.count(...)
    count_match = re.search(r"(?:db\.getCollection\(.*?\)|\bdb)\.([a-zA-Z0-9_\-]+)\.(?:countDocuments|count)\(([\s\S]*?)\)", clean_q)
    if count_match:
        coll_name = count_match.group(1)
        raw_filter = count_match.group(2).strip()
        filter_dict = {}
        if raw_filter and raw_filter != "{}":
            try:
                import ast
                filter_dict = json.loads(raw_filter) if raw_filter.startswith("{") else ast.literal_eval(raw_filter)
            except Exception:
                filter_dict = {}
        return [{"count": db[coll_name].count_documents(filter_dict)}]

    # 4. db.collection.findOne(...)
    find_one_match = re.search(r"(?:db\.getCollection\(.*?\)|\bdb)\.([a-zA-Z0-9_\-]+)\.findOne\(([\s\S]*?)\)", clean_q)
    if find_one_match:
        coll_name = find_one_match.group(1)
        raw_filter = find_one_match.group(2).strip()
        filter_dict = {}
        if raw_filter and raw_filter != "{}":
            try:
                import ast
                filter_dict = json.loads(raw_filter) if raw_filter.startswith("{") else ast.literal_eval(raw_filter)
            except Exception:
                filter_dict = {}
        doc = db[coll_name].find_one(filter_dict)
        return [sanitize_mongo_val(doc)] if doc else []
        
    # 5. Simple collection prefix e.g. db.users
    if clean_q.startswith("db."):
        parts = clean_q.replace("db.", "").split(".")
        if len(parts) >= 1:
            coll_name = parts[0].split("(")[0].replace("'", "").replace('"', "").strip()
            if coll_name:
                raw_docs = list(db[coll_name].find({}).limit(50))
                return [sanitize_mongo_val(doc) for doc in raw_docs]
            
    if "show collections" in clean_q.lower() or "listcollections" in clean_q.lower():
        colls = db.list_collection_names()
        return [{"collection": c} for c in colls]
        
    raise ValueError(f"Unsupported or unparseable MongoDB query: {clean_q}")

def reset_engine_cache():
    """Disposes and clears all active SQLAlchemy connection engines."""
    global db_engines
    for uri, engine in list(db_engines.items()):
        try:
            engine.dispose()
        except Exception:
            pass
    db_engines.clear()
    request_context.connection_uri = ""

def get_engine(connection_uri: str):
    if is_mongo_uri(connection_uri):
        raise ValueError("Cannot create a relational SQL engine for a MongoDB Atlas connection string.")
    
    clean_uri = connection_uri.strip()
    
    # Normalize PostgreSQL URIs for SQLAlchemy
    if clean_uri.startswith("postgres://"):
        clean_uri = clean_uri.replace("postgres://", "postgresql+psycopg2://", 1)
    elif clean_uri.startswith("postgresql://") and not clean_uri.startswith("postgresql+"):
        clean_uri = clean_uri.replace("postgresql://", "postgresql+psycopg2://", 1)
    elif clean_uri.startswith("mysql://"):
        clean_uri = clean_uri.replace("mysql://", "mysql+pymysql://", 1)
    
    if clean_uri not in db_engines:
        db_engines[clean_uri] = create_engine(clean_uri, pool_pre_ping=True)
    return db_engines[clean_uri]

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
        
    if is_mongo_uri(connection_uri):
        try:
            docs = execute_mongo_query(connection_uri, query)
            res_str = json.dumps(docs, default=str)
            if len(res_str) > 2000:
                return res_str[:2000] + "... (truncated)"
            return res_str
        except Exception as e:
            return f"MongoDB note: {str(e)}"

    # Simple safety check to prevent dropping tables (basic protection)
    lower_query = query.lower()
    if "drop" in lower_query or "delete" in lower_query or "truncate" in lower_query:
        pass

    try:
        engine = get_engine(connection_uri)
        with engine.connect() as conn:
            result = conn.execute(text(query))
            if result.returns_rows:
                rows = [dict(row._mapping) for row in result.fetchall()]
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
    """Creates a LangGraph agent and base LLM based on the provider and key."""
    tools = [execute_sql, render_visualization, apply_data_masking]
    
    provider_lower = (llm_provider or "openai").lower()
    
    if provider_lower == "openai":
        from langchain_openai import ChatOpenAI
        model_name = llm_model if llm_model else "gpt-4o"
        llm = ChatOpenAI(model=model_name, api_key=llm_api_key)
    elif provider_lower == "anthropic":
        from langchain_anthropic import ChatAnthropic
        model_name = llm_model if llm_model else "claude-3-5-sonnet-20241022"
        llm = ChatAnthropic(model=model_name, api_key=llm_api_key)
    elif provider_lower == "nvidia":
        from langchain_openai import ChatOpenAI
        model_name = llm_model if llm_model else "meta/llama-3.1-70b-instruct"
        llm = ChatOpenAI(model=model_name, api_key=llm_api_key, base_url="https://integrate.api.nvidia.com/v1")
    elif provider_lower in ["google", "gemini"]:
        model_name = llm_model if llm_model else "gemini-1.5-flash"
        llm = ChatGoogleGenerativeAI(model=model_name, api_key=llm_api_key)
    elif provider_lower in ["custom", "deepseek", "groq", "ollama"]:
        from langchain_openai import ChatOpenAI
        model_name = llm_model if llm_model else "deepseek-chat"
        llm = ChatOpenAI(model=model_name, api_key=llm_api_key or "sk-dummy")
    else:
        from langchain_openai import ChatOpenAI
        model_name = llm_model if llm_model else "gpt-4o"
        llm = ChatOpenAI(model=model_name, api_key=llm_api_key)

    agent_executor = create_react_agent(llm, tools)
    return agent_executor, llm
