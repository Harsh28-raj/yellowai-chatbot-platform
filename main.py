from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import Optional
import uuid
import re

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from llm_service import generate_ai_response

# 1. Setup Rate Limiter (by IP)
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Yellow.ai Chatbot Microservice")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 2. CORS Middleware (Frontend Integration Ready)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Input Validation & Guardrails Model
class ChatRequest(BaseModel):
    project_id: str = Field(..., min_length=1, max_length=50, description="Project ID is required")
    message: str = Field(..., min_length=1, max_length=2000, description="Message length must be between 1 and 2000 chars")
    session_id: Optional[str] = Field(None, max_length=100)

    @validator("message")
    def validate_message_content(cls, value):
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Message cannot be blank or contain only whitespace.")
        
        # Basic Prompt Injection Guardrail Patterns
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
    return {"status": "AI Microservice is running!"}

@app.post("/chat")
@limiter.limit("20/minute")  # Rate limit rule: 20 calls/min per IP
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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"status": "error", "message": str(ve)}
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"status": "error", "message": f"Internal Server Error: {str(e)}"}
        )