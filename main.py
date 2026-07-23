from fastapi import FastAPI
from pydantic import BaseModel
from llm_service import generate_ai_response

app = FastAPI(title="Yellow.ai Chatbot Microservice")

class ChatRequest(BaseModel):
    project_id: str
    message: str
    session_id: str = None

@app.get("/")
def read_root():
    return {"status": "AI Microservice is running!"}

@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    # Call OpenAI LLM through our service
    ai_reply = generate_ai_response(
        project_id=request.project_id, 
        user_message=request.message
    )
    
    return {
        "reply": ai_reply,
        "project_id": request.project_id,
        "status": "success"
    }