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
    metadata: dict,
    conversation_id: str 
):
    try:
        # Create a copy to avoid modifying the original metadata
        processed_metadata = metadata.copy()
        
        # Ensure conversation_id is always present
        processed_metadata["conversation_id"] = conversation_id
        
        # Convert tables to string if needed
        if "tables" in processed_metadata:
            if isinstance(processed_metadata["tables"], list):
                processed_metadata["tables"] = ", ".join(processed_metadata["tables"])
            elif not isinstance(processed_metadata["tables"], str):
                processed_metadata["tables"] = str(processed_metadata["tables"])
        
        # Generate timestamp once per pair
        timestamp = datetime.utcnow().isoformat()
        
        # Generate UUID once per message pair
        pair_uuid = str(uuid.uuid4())
        
        collection.add(
            documents=[user_message, assistant_message],
            embeddings=[user_embedding, assistant_embedding],
            metadatas=[
                {**processed_metadata, "type": "user", "timestamp": timestamp},
                {**processed_metadata, "type": "assistant", "timestamp": timestamp}
            ],
            ids=[f"user_{pair_uuid}", f"assistant_{pair_uuid}"]
        )
        logger.info(f"Stored conversation pair: user_{pair_uuid}, assistant_{pair_uuid}")
        
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

def delete_conversation_by_id(conversation_id: str):
    """Delete entire conversation by conversation_id from metadata"""
    try:
        client = get_chroma_client()
        collection = client.get_collection("chat_history")
        
        # Get all message IDs for this conversation
        result = collection.get(
            where={"conversation_id": {"$eq": conversation_id}},
            include=[]  # IDs are always returned
        )
        
        if result["ids"]:
            collection.delete(ids=result["ids"])
            logger.info(f"Deleted {len(result['ids'])} messages in conversation {conversation_id}")
            
    except Exception as e:
        logger.error(f"Conversation deletion failed: {str(e)}")
        raise
