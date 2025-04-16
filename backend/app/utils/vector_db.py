from datetime import datetime
import chromadb
from chromadb.config import Settings
import uuid
import logging

logger = logging.getLogger("schema_verification.vector_db")

def get_chroma_client():
    return chromadb.PersistentClient(
        path="./chroma_data",
        settings=Settings(anonymized_telemetry=False)
    )

client = get_chroma_client()
collection = client.get_or_create_collection("chat_history")

def add_message_to_history(
    user_message: str,
    assistant_message: str,
    user_embedding: list[float],
    assistant_embedding: list[float],
    metadata: dict
):
    try:
        # Convert tables list to string
        if "tables" in metadata and isinstance(metadata["tables"], list):
            metadata["tables"] = ", ".join(metadata["tables"])
        
        timestamp = datetime.utcnow().isoformat()
        pair_uuid = str(uuid.uuid4())  # <-- Generate ONCE per pair!

        collection.add(
            documents=[user_message, assistant_message],
            embeddings=[user_embedding, assistant_embedding],
            metadatas=[
                {**metadata, "type": "user", "timestamp": timestamp},
                {**metadata, "type": "assistant", "timestamp": timestamp}
            ],
            ids=[f"user_{pair_uuid}", f"assistant_{pair_uuid}"]  # <-- Use SAME uuid
        )
    except Exception as e:
        logger.error(f"Storage failed: {str(e)}", exc_info=True)
        raise


def get_relevant_history(query_embedding: list[float], k: int = 3, where: dict = None) -> list[str]:
    """Get raw documents without unpacking"""
    try:
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=k,
            where=where,
            include=["documents"]  # Only get document texts
        )
        return results['documents'][0] if results['documents'] else []
    except Exception as e:
        logger.error(f"Query failed: {str(e)}", exc_info=True)
        return []

def delete_conversation_by_id(item_id: str):
    """
    Deletes both user and assistant messages for a conversation,
    given either a user_... or assistant_... ID.
    """
    from app.utils.vector_db import get_chroma_client  # or your import style
    client = get_chroma_client()
    collection = client.get_collection("chat_history")
    uuid_part = item_id.split("_", 1)[1]
    user_id = f"user_{uuid_part}"
    assistant_id = f"assistant_{uuid_part}"
    try:
        collection.delete(ids=[user_id, assistant_id])
        logger.info(f"Deleted conversation: {user_id} & {assistant_id}")
    except Exception as e:
        logger.error(f"Failed to delete conversation: {user_id}, {assistant_id}: {str(e)}")
        raise
