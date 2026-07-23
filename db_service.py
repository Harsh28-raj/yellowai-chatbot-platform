# Temporary in-memory / file knowledge store per project_id
project_knowledge_base = {}

def get_system_prompt(project_id: str) -> str:
    base_prompts = {
        "support_bot": "You are Yellow.ai's official AI assistant. Answer queries politely and accurately.",
        "sales_bot": "You are an aggressive sales assistant aiming to convert leads.",
        "default": "You are a helpful AI assistant."
    }
    
    prompt = base_prompts.get(project_id, base_prompts["default"])
    
    # Check if any uploaded document context exists for this project (Basic RAG)
    if project_id in project_knowledge_base:
        doc_context = project_knowledge_base[project_id]
        prompt += f"\n\n--- ADDITIONAL CONTEXT FROM UPLOADED DOCUMENTS ---\n{doc_context}\n--------------------------------------------------"
        
    return prompt

def save_project_document(project_id: str, content: str):
    """Saves/appends extracted file text into the project context."""
    existing = project_knowledge_base.get(project_id, "")
    project_knowledge_base[project_id] = (existing + "\n\n" + content).strip()