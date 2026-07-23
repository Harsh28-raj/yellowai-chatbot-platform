import os
from openai import OpenAI
from dotenv import load_dotenv
from db_service import get_system_prompt
from tenacity import retry, stop_after_attempt, wait_exponential

load_dotenv()

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY")
)

# In-memory dictionary for session history
session_store = {}

# Tenacity Retry Decorator: Retries 3 times with exponential backoff on API failures
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    reraise=True
)
def _call_groq_api_with_retry(messages):
    return client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
        timeout=10.0  # 10s Timeout limit
    )

def generate_ai_response(project_id: str, user_message: str, session_id: str = "default_session") -> tuple[str, str]:
    try:
        system_prompt = get_system_prompt(project_id)
        history = session_store.get(session_id, [])
        messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": user_message}]
        
        # Calling API with automatic retry wrapper
        response = _call_groq_api_with_retry(messages)
        ai_reply = response.choices[0].message.content

        # Update Session History
        if session_id not in session_store:
            session_store[session_id] = []
            
        session_store[session_id].append({"role": "user", "content": user_message})
        session_store[session_id].append({"role": "assistant", "content": ai_reply})
        
        # Sliding window (Keep last 20 messages / 10 turns)
        if len(session_store[session_id]) > 20:
            session_store[session_id] = session_store[session_id][-20:]

        return ai_reply, session_id

    except Exception as e:
        print(f"Error in LLM Service after retries: {str(e)}")
        # Graceful fallback response (na ki 500 server crash)
        return "The AI service is temporarily experiencing high traffic. Please try again in a few moments.", session_id