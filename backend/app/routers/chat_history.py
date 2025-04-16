# routers/chat_history.py
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict
from collections import defaultdict
from app.utils.vector_db import delete_conversation_by_id, get_chroma_client
from app.schemas import ConversationItem, MessageItem
import logging
import re

router = APIRouter(prefix="/api/chat-history", tags=["Chat History"])
logger = logging.getLogger("schema_verification.api")

# Regex pattern to validate conversation IDs (new format)
CONVERSATION_ID_PATTERN = re.compile(r"^conv_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")

@router.get("", response_model=List[ConversationItem])
async def get_chat_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    database: Optional[str] = None,
    table: Optional[str] = None
):
    """Retrieve paginated conversations with filters"""
    try:
        client = get_chroma_client()
        collection = client.get_collection("chat_history")
        
        # Build where clause
        where_clause = _build_where_clause(database, table)
        
        query_params = {
            "limit": limit * 4,
            "offset": offset * 4,
            "include": ["metadatas", "documents"]
        }

         # Only add where clause if it exists
        if where_clause is not None:
            query_params["where"] = where_clause

        # Fetch all relevant messages
        result = collection.get(**query_params)

        # Group messages by conversation_id
        conversations = defaultdict(list)
        for i in range(len(result.get("ids", []))):
            metadata = result["metadatas"][i]
            conv_id = metadata.get("conversation_id")
            if not conv_id:
                continue
                
            conversations[conv_id].append(
                MessageItem(
                    id=result["ids"][i],
                    prompt=result["documents"][i],
                    response=result["documents"][i+1] if i % 2 == 0 else "",  # Pair logic
                    timestamp=metadata.get("timestamp", "")
                )
            )
        
        # Build response
        conv_items = []
        for conv_id, messages in conversations.items():
            if not messages:
                continue
                
            # Get metadata from first message
            first_metadata = result["metadatas"][result["ids"].index(messages[0].id)]
            conv_items.append(
                ConversationItem(
                    id=conv_id,
                    database=first_metadata.get("database", "unknown"),
                    tables=_parse_tables(first_metadata.get("tables", [])),
                    messages=messages,
                    last_updated=max(msg.timestamp for msg in messages)
                )
            )
        
        return sorted(conv_items, key=lambda x: x.last_updated, reverse=True)[:limit]

    except Exception as e:
        logger.error(f"History retrieval failed: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to retrieve chat history"}
        )

@router.get("/{conversation_id}", response_model=ConversationItem)
async def get_conversation(conversation_id: str):
    """Get entire conversation by conversation_id"""
    try:
        if not CONVERSATION_ID_PATTERN.match(conversation_id):
            raise HTTPException(400, "Invalid conversation ID format")
            
        client = get_chroma_client()
        collection = client.get_collection("chat_history")
        
        # Get all messages for this conversation
        result = collection.get(
            where={"conversation_id": {"$eq": conversation_id}},
            include=["metadatas", "documents"]
        )
        
        if not result.get("ids"):
            raise HTTPException(404, "Conversation not found")
            
        messages = [
            MessageItem(
                id=result["ids"][i],
                prompt=result["documents"][i],
                response=result["documents"][i+1] if i % 2 == 0 else "",
                timestamp=result["metadatas"][i].get("timestamp", "")
            )
            for i in range(len(result["ids"]))
        ]
        
        first_metadata = result["metadatas"][0]
        return ConversationItem(
            id=conversation_id,
            database=first_metadata.get("database", "unknown"),
            tables=_parse_tables(first_metadata.get("tables", [])),
            messages=messages,
            last_updated=max(msg.timestamp for msg in messages)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch conversation: {str(e)}")
        raise HTTPException(500, "Failed to retrieve conversation")

@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str):
    """Delete entire conversation by ID"""
    try:
        if not CONVERSATION_ID_PATTERN.match(conversation_id):
            raise HTTPException(400, "Invalid conversation ID format")
            
        delete_conversation_by_id(conversation_id)  # Use the vector_db function
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Deletion failed: {str(e)}")
        raise HTTPException(500, "Conversation deletion failed")



# Helper functions ------------------------------------------------------------

def _build_where_clause(database: Optional[str], table: Optional[str]) -> Optional[Dict]:
    """Build ChromaDB-compatible where clause"""
    filters = []
    if database:
        filters.append({"database": {"$eq": database}})
    if table:
        filters.append({"tables": {"$contains": table}})
    
    if not filters:
        return None  # Return None instead of empty dict
    return {"$and": filters} if len(filters) > 1 else filters[0]


def _parse_tables(tables) -> List[str]:
    if isinstance(tables, str):
        return [t.strip() for t in tables.split(",") if t.strip()]
    return tables
