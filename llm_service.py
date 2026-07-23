import os
from openai import OpenAI
from dotenv import load_dotenv
from db_service import get_system_prompt

# .env file se variables load karo
load_dotenv()

# OpenAI client ko Groq ke endpoint par point karo
client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=os.getenv("GROQ_API_KEY")
)

def generate_ai_response(project_id: str, user_message: str) -> str:
    try:
        # DB service se project ka system prompt nikalo
        system_prompt = get_system_prompt(project_id)
        
        # Groq API call
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",  # High quality, ultra-fast model
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7
        )
        
        return response.choices[0].message.content

    except Exception as e:
        print(f"Error in LLM Service: {str(e)}")
        return "Sorry, I am having trouble connecting to the AI service right now."