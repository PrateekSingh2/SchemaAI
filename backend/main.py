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

class CommandRequest(BaseModel):
    prompt: str
    llmProvider: str
    llmApiKey: str
    dbType: str
    connectionUri: str = ""

@app.post("/api/v1/agent/command")
async def run_command(req: CommandRequest):
    if not req.llmApiKey:
        raise HTTPException(status_code=400, detail="Missing API Key")

    try:
        # Set the connection URI in the request context so tools can access it
        agent.request_context.connection_uri = req.connectionUri

        # Create the LangGraph agent executor
        agent_executor = agent.create_agent(req.llmProvider, req.llmApiKey)
        
        # Invoke the agent
        response = agent_executor.invoke({
            "messages": [("user", req.prompt)]
        })
        
        # LangGraph returns a dict with "messages". The last message is the AI's final response.
        final_message = response["messages"][-1].content
        
        # We need to format the response to match what the Next.js frontend expects
        # The frontend currently expects: { type: "sql", content: "..." } or { type: "text", content: "..." }
        
        # Since this is a simple AI response, we'll try to extract SQL if present
        # In a real app, you'd use structured output or a specific parser
        if "SELECT" in final_message.upper() or "UPDATE" in final_message.upper():
            # Very naive extraction for demo purposes
            sql_match = final_message
            if "```sql" in final_message:
                sql_match = final_message.split("```sql")[1].split("```")[0].strip()
            elif "```" in final_message:
                sql_match = final_message.split("```")[1].split("```")[0].strip()
                
            return {"type": "sql", "content": sql_match, "raw_response": final_message}
        
        return {"type": "text", "content": final_message}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ExecuteRequest(BaseModel):
    sql: str
    connectionUri: str

@app.post("/api/v1/agent/execute")
async def run_execute(req: ExecuteRequest):
    if not req.connectionUri:
        raise HTTPException(status_code=400, detail="Missing connectionUri")
    try:
        from sqlalchemy import text
        engine = agent.get_engine(req.connectionUri)
        with engine.connect() as conn:
            result = conn.execute(text(req.sql))
            if result.returns_rows:
                rows = [dict(row._mapping) for row in result.fetchall()]
                columns = list(result.keys()) if result.keys() else []
                return {"records": rows, "columns": columns}
            else:
                conn.commit()
                return {"records": [], "columns": [], "message": "Execution successful. No rows returned."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
