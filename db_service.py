# System Prompts for different projects
# (In production, this would be fetched from Postgres/Supabase DB)
PROJECT_PROMPTS = {
    "support_bot": "You are a polite customer support agent for Yellow.ai. Answer concisely and professionally.",
    "sales_bot": "You are an enthusiastic sales assistant. Highlight product features and encourage users to book a demo.",
    "default": "You are a helpful AI assistant."
}

def get_system_prompt(project_id: str) -> str:
    """
    Fetches system prompt based on project_id.
    Falls back to default prompt if project_id is not found.
    """
    return PROJECT_PROMPTS.get(project_id, PROJECT_PROMPTS["default"])