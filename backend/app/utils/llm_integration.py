import uuid
import ollama
import logging
from typing import List, Dict
from app.utils.vector_db import add_message_to_history, get_relevant_history
from app.utils.embeddings import get_embedding

logger = logging.getLogger("schema_verification.llm")

# --- Conversation State Management ---
current_conversation_id = None

def start_new_conversation():
    """Call this before a new analysis to reset conversation context."""
    global current_conversation_id
    current_conversation_id = None
    logger.info("Conversation reset for new analysis")

# --- Main Analysis Function ---

def analyze_schema(
    prompt: str,
    schema_info: str,
    selected_tables: List[str],
    database_name: str
) -> Dict:
    """
    Enterprise-Grade Schema Analysis with Conversation Tracking.
    Returns analysis, DDL, context_used, and conversation_id.
    """
    global current_conversation_id
    try:
        # Start new conversation if none exists
        if not current_conversation_id:
            current_conversation_id = f"conv_{uuid.uuid4()}"
            logger.info(f"New conversation started: {current_conversation_id}")

        logger.info(f"Analysis initiated | DB: {database_name} | Tables: {selected_tables}")

        # 1. Context Retrieval
        query_embedding = get_embedding(prompt)
        context = _get_enhanced_context(query_embedding, database_name, selected_tables)

        # 2. LLM Prompt Engineering
        messages = _build_llm_messages(prompt, schema_info, context, database_name, selected_tables)

        # 3. LLM Execution
        response = _safe_llm_call(messages)
        analysis = _validate_llm_response(response)

        # 4. Atomic Storage with conversation ID
        _store_interaction(
            prompt=prompt,
            analysis=analysis,
            user_embedding=query_embedding,
            metadata={
                "database": database_name,
                "tables": selected_tables,
                "schema_version": "1.2"
            }
        )

        return {
            "analysis": analysis,
            "ddl": _extract_ddl(analysis),
            "context_used": bool(context),
            "conversation_id": current_conversation_id
        }

    except Exception as e:
        logger.error(f"Analysis failed | DB: {database_name} | Error: {str(e)}", exc_info=True)
        raise

# --- Helper Functions ---

def _get_enhanced_context(embedding: List[float], database: str, tables: List[str]) -> str:
    """Get context with proper ChromaDB result handling."""
    try:
        results = get_relevant_history(
            query_embedding=embedding,
            k=5,
            where={"database": {"$eq": database}}
        )
        paired_results = []
        for i in range(0, len(results) - 1, 2):
            if i+1 < len(results):
                paired_results.append((results[i], results[i+1]))
        filtered = [
            (q, a) for q, a in paired_results
            if any(table in q or table in a for table in tables)
        ]
        return "\n".join([f"Related Q: {q}\nA: {a}" for q, a in filtered[:3]])
    except Exception as e:
        logger.warning(f"Context retrieval failed: {str(e)}")
        return ""

def _build_llm_messages(prompt: str, schema: str, context: str, db: str, tables: List[str]) -> List[Dict]:
    """Structured Prompt Engineering."""
    return [
        {
            "role": "system",
            "content": f"""You are a senior data architect analyzing {db} schema.
            Current Tables: {', '.join(tables)}
            Rules:
            1. Generate ANSI-SQL DDL with constraints
            2. Prefer star schema for analytics
            3. Add indexes for frequent query columns
            4. Include column comments
            Context:\n{context}"""
        },
        {
            "role": "user",
            "content": f"Query: {prompt}\nSchema Details:\n{schema}"
        }
    ]

def _safe_llm_call(messages: List[Dict], retries: int = 3) -> Dict:
    """Robust LLM Communication."""
    for attempt in range(retries):
        try:
            return ollama.chat(
                model="llama3.2",
                messages=messages,
                options={
                    "temperature": 0.3,
                    "num_ctx": 4096,
                    "num_predict": 4096,
                    "top_k": 20,
                    "stop": []
                }
            )
        except Exception as e:
            if attempt == retries - 1:
                raise
            logger.warning(f"LLM call failed (attempt {attempt+1}): {str(e)}")

def _validate_llm_response(response: Dict) -> str:
    """Response Validation."""
    if not response.get('message') or not response['message'].get('content'):
        raise ValueError("Invalid LLM response structure")
    return response['message']['content']

def _store_interaction(prompt: str, analysis: str, user_embedding: List[float], metadata: dict):
    """Atomic History Storage with Conversation ID."""
    global current_conversation_id
    add_message_to_history(
        user_message=prompt,
        assistant_message=analysis,
        user_embedding=user_embedding,
        assistant_embedding=get_embedding(analysis),
        metadata=metadata,
        conversation_id=current_conversation_id
    )

def _extract_ddl(response: str) -> List[str]:
    """DDL Extraction."""
    return [
        f"{line.strip().rstrip(';')};"
        for line in response.split('\n')
        if any(cmd in line.upper() for cmd in ["CREATE TABLE", "ALTER TABLE", "CREATE INDEX"])
    ]
