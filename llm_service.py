import os
import json
from typing import Generator
from openai import OpenAI
from dotenv import load_dotenv
from db_service import get_system_prompt
from tenacity import retry, stop_after_attempt, wait_exponential
from langsmith import traceable
import redis

load_dotenv()

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY")
)

# 1. Setup Redis Connection with Graceful In-Memory Fallback
redis_url = os.getenv("REDIS_URL")
redis_client = None
in_memory_store = {}

if redis_url:
    try:
        redis_client = redis.Redis.from_url(redis_url, decode_responses=True)
        redis_client.ping()
        print("✅ Connected to Redis successfully!")
    except Exception as e:
        print(f"⚠️ Redis connection failed ({str(e)}). Falling back to In-Memory store.")
        redis_client = None

# Helper functions for Session Persistence
def _get_history(session_id: str) -> list:
    if redis_client:
        data = redis_client.get(f"session:{session_id}")
        return json.loads(data) if data else []
    return in_memory_store.get(session_id, [])

def _save_history(session_id: str, history: list):
    # Keep last 20 messages (10 turns)
    trimmed_history = history[-20:] if len(history) > 20 else history
    if redis_client:
        # Save to Redis with 24 Hours TTL (86400 seconds)
        redis_client.setex(f"session:{session_id}", 86400, json.dumps(trimmed_history))
    else:
        in_memory_store[session_id] = trimmed_history

# 2. Tenacity Retry Logic
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    reraise=True
)
def _call_groq_api(messages, stream: bool = False):
    return client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
        stream=stream,
        timeout=10.0
    )

# 3. Standard Non-Streaming Function (LangSmith Traceable)
@traceable(name="Groq_Standard_Chat")
def generate_ai_response(project_id: str, user_message: str, session_id: str) -> tuple[str, str]:
    try:
        system_prompt = get_system_prompt(project_id)
        history = _get_history(session_id)
        messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": user_message}]
        
        response = _call_groq_api(messages, stream=False)
        ai_reply = response.choices[0].message.content

        # Update History
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": ai_reply})
        _save_history(session_id, history)

        return ai_reply, session_id

    except Exception as e:
        print(f"Error in LLM Service: {str(e)}")
        return "The AI service is temporarily experiencing high traffic. Please try again.", session_id

# 4. SSE Streaming Generator (LangSmith Traceable)
@traceable(name="Groq_Streaming_Chat")
def generate_ai_response_stream(project_id: str, user_message: str, session_id: str) -> Generator[str, None, None]:
    try:
        system_prompt = get_system_prompt(project_id)
        history = _get_history(session_id)
        messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": user_message}]
        
        response = _call_groq_api(messages, stream=True)
        full_ai_reply = ""

        for chunk in response:
            content = chunk.choices[0].delta.content or ""
            if content:
                full_ai_reply += content
                # Format chunk as Server-Sent Event (SSE)
                yield f"data: {json.dumps({'chunk': content, 'session_id': session_id})}\n\n"

        # Save history after full stream generation completes
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": full_ai_reply})
        _save_history(session_id, history)

    except Exception as e:
        err_msg = json.dumps({"error": f"Streaming Error: {str(e)}"})
        yield f"data: {err_msg}\n\n"