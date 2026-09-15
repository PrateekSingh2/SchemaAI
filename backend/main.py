from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import agent
import json

app = FastAPI(title="SchemaAI Agent Backend")

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "SchemaAI Agent Backend",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "/api/v1/agent/command",
            "/api/v1/agent/execute",
            "/api/v1/agent/reset-connection",
            "/docs"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

class CommandRequest(BaseModel):
    prompt: str
    llmProvider: str
    llmApiKey: str
    llmModel: str = ""
    dbType: str = "PostgreSQL"
    connectionUri: str = ""
    schemaContext: str = ""

@app.post("/api/v1/agent/command")
async def run_command(req: CommandRequest):
    if not req.llmApiKey:
        raise HTTPException(status_code=400, detail="Missing API Key. Please configure your AI API Key in SchemaAI Settings.")

    try:
        # Store connection context globally for the tool to access
        agent.request_context.connection_uri = req.connectionUri

        # Create the LangGraph agent executor and direct LLM
        agent_executor, llm = agent.create_agent(req.llmProvider, req.llmApiKey, req.llmModel, req.dbType)
        
        # Determine specific database engine type
        db_clean = req.dbType.strip()
        db_lower = db_clean.lower()
        
        is_mongo = "mongo" in db_lower or agent.is_mongo_uri(req.connectionUri)
        is_mysql = "mysql" in db_lower
        is_postgres = any(p in db_lower for p in ["postgres", "supabase", "neon", "cockroach"])
        is_sqlite = "sqlite" in db_lower
        is_snowflake = "snowflake" in db_lower
        
        schema_info = f"\nDatabase Schema Context (Introspected Tables & Fields):\n{req.schemaContext}\n" if req.schemaContext else ""

        if is_mongo:
            system_prompt = (
                f"You are a Principal MongoDB Atlas Data Engineer and AI Copilot.\n"
                f"Target Engine: MongoDB Atlas / Document Store (Database: {req.dbType})\n"
                f"{schema_info}\n"
                "CRITICAL INSTRUCTIONS FOR MONGODB:\n"
                "1. All collections, document fields, and data types are ALREADY INTROSPECTED and provided in the Schema Context.\n"
                "2. Generate ONLY valid, executable native MongoDB shell / driver queries:\n"
                "   - `db.<collection>.find({ <filter> }, { <projection> }).sort({ <sort> }).limit(<limit>)`\n"
                "   - `db.<collection>.aggregate([ <stages> ])`\n"
                "   - `db.<collection>.countDocuments({ <filter> })`\n"
                "   - `db.<collection>.findOne({ <filter> })`\n"
                "3. NEVER generate SQL syntax (SELECT, FROM, WHERE, JOIN) for MongoDB.\n"
                "4. Use valid JSON/BSON object formatting. Do NOT quote field names with SQL backticks or double quotes.\n"
                "5. ALWAYS wrap the query inside a ```javascript or ```mongodb or ```json code block.\n"
                "Example:\n"
                "```javascript\n"
                "db.users.find({ status: \"active\" }, { name: 1, email: 1, _id: 1 }).sort({ createdAt: -1 }).limit(10)\n"
                "```"
            )
        elif is_mysql:
            system_prompt = (
                f"You are a Principal MySQL 8.0+ Database Architect and AI Copilot.\n"
                f"Target Engine: MySQL 8.0+ (Database: {req.dbType})\n"
                f"{schema_info}\n"
                "CRITICAL INSTRUCTIONS FOR MYSQL:\n"
                "1. Target Dialect: MySQL 8.0+.\n"
                "2. Identifier Quoting: Use backticks `` `table_name` `` and `` `column_name` `` where appropriate.\n"
                "3. String Literals: Use single quotes `'value'`.\n"
                "4. Dialect Rules:\n"
                "   - Use `IFNULL()`, `COALESCE()`, `NOW()`, `CURDATE()`, `DATE_SUB()`, `DATE_FORMAT()`, `CONCAT()`, `GROUP_CONCAT()`.\n"
                "   - Use `LIMIT <offset>, <count>` or `LIMIT <count>`.\n"
                "   - DO NOT use PostgreSQL-specific syntax like `ILIKE`, `::type` casting, or `\"public\".\"table\"`.\n"
                "5. Target ONLY the exact table and column names in the Schema Context.\n"
                "6. ALWAYS wrap the complete SQL query in a ```sql ... ``` code block."
            )
        elif is_sqlite:
            system_prompt = (
                f"You are a Principal SQLite 3 Database Architect and AI Copilot.\n"
                f"Target Engine: SQLite 3 (Database: {req.dbType})\n"
                f"{schema_info}\n"
                "CRITICAL INSTRUCTIONS FOR SQLITE:\n"
                "1. Target Dialect: SQLite 3.\n"
                "2. Dialect Rules:\n"
                "   - Use `strftime()`, `IFNULL()`, `datetime('now')`, `COALESCE()`.\n"
                "   - Use `LIMIT <count> OFFSET <offset>`.\n"
                "3. Target ONLY the exact table and column names in the Schema Context.\n"
                "4. ALWAYS wrap the complete SQL query in a ```sql ... ``` code block."
            )
        elif is_snowflake:
            system_prompt = (
                f"You are a Principal Snowflake Data Cloud Architect and AI Copilot.\n"
                f"Target Engine: Snowflake SQL (Database: {req.dbType})\n"
                f"{schema_info}\n"
                "CRITICAL INSTRUCTIONS FOR SNOWFLAKE:\n"
                "1. Target Dialect: Snowflake SQL.\n"
                "2. Use standard uppercase keywords, `IFF()`, `TRY_CAST()`, `QUALIFY`, `ARRAY_AGG()`.\n"
                "3. Target ONLY the exact table and column names in the Schema Context.\n"
                "4. ALWAYS wrap the complete SQL query in a ```sql ... ``` code block."
            )
        else: # PostgreSQL / Supabase / Neon / CockroachDB
            system_prompt = (
                f"You are a Principal PostgreSQL & Supabase Database Architect and AI Copilot.\n"
                f"Target Engine: PostgreSQL / Supabase (Database: {req.dbType})\n"
                f"{schema_info}\n"
                "CRITICAL INSTRUCTIONS FOR POSTGRESQL / SUPABASE:\n"
                "1. Target Dialect: PostgreSQL 14+ / Supabase.\n"
                "2. Identifier Quoting: Double quotes `\"table_name\"` or unquoted lowercase identifiers.\n"
                "3. String Literals: Single quotes `'value'`.\n"
                "4. Dialect Rules:\n"
                "   - Use `ILIKE` for case-insensitive pattern matching.\n"
                "   - Use `COALESCE()`, `NOW()`, `TO_CHAR()`, `date_trunc()`, `AGE()`.\n"
                "   - Use PostgreSQL type casting `value::text`, `value::integer`, `value::date`.\n"
                "   - For JSON/JSONB fields, use `->`, `->>`, `#>`, or `jsonb_extract_path_text()`.\n"
                "   - Use `LIMIT <n> OFFSET <m>`.\n"
                "5. Target ONLY the exact table and column names in the Schema Context.\n"
                "6. ALWAYS wrap the complete SQL query in a ```sql ... ``` code block."
            )

        # Directly synthesize query using the LLM and rich schema context
        from langchain_core.messages import SystemMessage, HumanMessage
        direct_res = llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=req.prompt)
        ])
        final_message = direct_res.content

        if isinstance(final_message, list):
            final_message = "".join([str(m.get("text", m)) if isinstance(m, dict) else str(m) for m in final_message])
        final_message = str(final_message)
        
        # Extract the query from code blocks or raw statements
        for block_tag in ["```sql", "```javascript", "```json", "```mongodb", "```mql", "```postgresql", "```postgres", "```"]:
            if block_tag in final_message.lower():
                tag_pos = final_message.lower().find(block_tag)
                raw_block = final_message[tag_pos + len(block_tag):]
                if "```" in raw_block:
                    query_match = raw_block.split("```")[0].strip()
                    if query_match:
                        return {"type": "sql", "content": query_match, "raw_response": final_message}

        # If it starts with standard query prefixes
        clean_msg = final_message.strip()
        upper_msg = clean_msg.upper()
        sql_prefixes = ("SELECT ", "WITH ", "SHOW ", "DESCRIBE ", "EXPLAIN ", "INSERT ", "UPDATE ", "DELETE ", "CREATE ", "ALTER ", "DROP ", "DB.")
        if any(upper_msg.startswith(prefix) for prefix in sql_prefixes):
            return {"type": "sql", "content": clean_msg, "raw_response": final_message}
            
        return {"type": "text", "content": final_message}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

class ExecuteRequest(BaseModel):
    sql: str
    connectionUri: str

@app.post("/api/v1/agent/execute")
async def run_execute(req: ExecuteRequest):
    if not req.connectionUri:
        raise HTTPException(status_code=400, detail="Missing connectionUri")
    try:
        if agent.is_mongo_uri(req.connectionUri) or req.sql.strip().startswith("db."):
            docs = agent.execute_mongo_query(req.connectionUri, req.sql)
            cols = []
            if docs and isinstance(docs, list) and len(docs) > 0 and isinstance(docs[0], dict):
                cols = list(docs[0].keys())
            return {"success": True, "records": docs, "columns": cols, "rowCount": len(docs)}
            
        from sqlalchemy import text
        engine = agent.get_engine(req.connectionUri)
        with engine.connect() as conn:
            result = conn.execute(text(req.sql))
            if result.returns_rows:
                raw_rows = [dict(row._mapping) for row in result.fetchall()]
                # Serialize row types (datetime, Decimal, etc.) safely
                clean_rows = []
                for row in raw_rows:
                    clean_row = {}
                    for k, v in row.items():
                        if hasattr(v, "isoformat"):
                            clean_row[k] = v.isoformat()
                        elif isinstance(v, (int, float, str, bool)) or v is None:
                            clean_row[k] = v
                        else:
                            clean_row[k] = str(v)
                    clean_rows.append(clean_row)
                columns = list(result.keys()) if result.keys() else []
                return {"success": True, "records": clean_rows, "columns": columns, "rowCount": len(clean_rows)}
            else:
                conn.commit()
                return {"success": True, "records": [], "columns": [], "rowCount": 0, "message": "Execution successful. No rows returned."}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/agent/reset-connection")
async def reset_connection():
    """Resets and purges all cached database connection pools in the backend."""
    try:
        agent.reset_engine_cache()
        return {"success": True, "message": "Backend database connection state and pools cleared."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

