from fastapi import FastAPI, Request, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, validator
from typing import Optional
import uuid
import re

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from llm_service import generate_ai_response, generate_ai_response_stream
from db_service import save_project_document

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Yellow.ai Enterprise Chatbot Microservice")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    project_id: str = Field(..., min_length=1, max_length=50)
    message: str = Field(..., min_length=1, max_length=2000)
    session_id: Optional[str] = Field(None, max_length=100)

    @validator("message")
    def validate_message_content(cls, value):
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Message cannot be blank.")
        
        suspicious_patterns = [
            r"ignore previous instructions",
            r"system prompt",
            r"you are now DAN",
            r"bypass safety rules"
        ]
        for pattern in suspicious_patterns:
            if re.search(pattern, cleaned, re.IGNORECASE):
                raise ValueError("Disallowed input pattern detected.")
        return cleaned

@app.get("/")
def read_root():
    return {"status": "AI Microservice is live with Streaming, Redis & LangSmith Tracing!"}

# Standard Non-Streaming Endpoint
@app.post("/chat")
@limiter.limit("20/minute")
def chat_endpoint(request: Request, body: ChatRequest):
    try:
        session_id = body.session_id or f"session_{uuid.uuid4().hex[:8]}"
        ai_reply, active_session_id = generate_ai_response(
            project_id=body.project_id,
            user_message=body.message,
            session_id=session_id
        )
        return {
            "reply": ai_reply,
            "project_id": body.project_id,
            "session_id": active_session_id,
            "status": "success"
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail={"status": "error", "message": str(ve)})
    except Exception as e:
        raise HTTPException(status_code=500, detail={"status": "error", "message": str(e)})

# 1️⃣ SSE Streaming Endpoint
@app.post("/chat/stream")
@limiter.limit("20/minute")
def chat_stream_endpoint(request: Request, body: ChatRequest):
    session_id = body.session_id or f"session_{uuid.uuid4().hex[:8]}"
    return StreamingResponse(
        generate_ai_response_stream(
            project_id=body.project_id,
            user_message=body.message,
            session_id=session_id
        ),
        media_type="text/event-stream"
    )

# 4️⃣ File Upload / Basic RAG Endpoint
@app.post("/projects/{project_id}/upload")
async def upload_document(project_id: str, file: UploadFile = File(...)):
    try:
        content_bytes = await file.read()
        # Extract text content from txt/md files
        text_content = content_bytes.decode("utf-8", errors="ignore")
        
        save_project_document(project_id, text_content)
        
        return {
            "status": "success",
            "filename": file.filename,
            "project_id": project_id,
            "message": "File context successfully injected into project prompt!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")