import os
from openai import OpenAI
from dotenv import load_dotenv
from db_service import get_system_prompt

load_dotenv()

client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY")
)

# In-memory dictionary to hold conversation history for each session
# Format: {"session_123": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
session_store = {}

def generate_ai_response(project_id: str, user_message: str, session_id: str = "default_session") -> tuple[str, str]:
    try:
        system_prompt = get_system_prompt(project_id)
        
        # 1. Fetch existing conversation history or initialize a new list
        history = session_store.get(session_id, [])
        
        # 2. Build full context payload: System Prompt + Past History + Current Message
        messages = [{"role": "system", "content": system_prompt}] + history + [{"role": "user", "content": user_message}]
        
        # 3. Call LLM with full context
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7
        )
        
        ai_reply = response.choices[0].message.content

        # 4. Save new conversation turn (User msg + AI reply) to memory
        if session_id not in session_store:
            session_store[session_id] = []
            
        session_store[session_id].append({"role": "user", "content": user_message})
        session_store[session_id].append({"role": "assistant", "content": ai_reply})
        
        # 5. Trim history if it gets too long (keeps last 10 back-and-forth turns)
        if len(session_store[session_id]) > 20:
            session_store[session_id] = session_store[session_id][-20:]

        return ai_reply, session_id

    except Exception as e:
        print(f"Error in LLM Service: {str(e)}")
        return "Sorry, I am having trouble connecting to the AI service right now.", session_id