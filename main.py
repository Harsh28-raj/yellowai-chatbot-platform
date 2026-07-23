from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import uuid
from llm_service import generate_ai_response

app = FastAPI(title="Yellow.ai Chatbot Microservice")

class ChatRequest(BaseModel):
    project_id: str
    message: str
    session_id: Optional[str] = None  # Optional field for memory tracking

@app.get("/")
def read_root():
    return {"status": "AI Microservice is running!"}

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    # Auto-generate a session_id if client doesn't pass one
    session_id = request.session_id or f"session_{uuid.uuid4().hex[:8]}"
    
    ai_reply, active_session_id = generate_ai_response(
        project_id=request.project_id,
        user_message=request.message,
        session_id=session_id
    )
    
    return {
        "reply": ai_reply,
        "project_id": request.project_id,
        "session_id": active_session_id,
        "status": "success"
    }