# routers/chat_history.py
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import JSONResponse
from typing import List, Optional
from app.utils.vector_db import delete_conversation_by_id, get_chroma_client
from app.schemas import ChatHistoryItem
import logging
import re

router = APIRouter(prefix="/api/chat-history", tags=["Chat History"])
logger = logging.getLogger("schema_verification.api")

ID_PATTERN = re.compile(
    r"^(user|assistant)_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
)

@router.get("", response_model=List[ChatHistoryItem])
async def get_chat_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    database: Optional[str] = None,
    table: Optional[str] = None
):
    """Retrieve paginated chat history with filters"""
    try:
        client = get_chroma_client()
        collection = client.get_collection("chat_history")
        
        # Build valid ChromaDB where clause
        where_clause = {}
        if database and table:
            where_clause = {
                "$and": [
                    {"database": {"$eq": database}},
                    {"tables": {"$contains": table}}
                ]
            }
        elif database:
            where_clause = {"database": {"$eq": database}}
        elif table:
            where_clause = {"tables": {"$contains": table}}

        # Only include where clause if filters are present
        query_params = {
            "limit": limit,
            "offset": offset,
            "include": ["metadatas", "documents"]
        }
        if where_clause:
            query_params["where"] = where_clause

        result = collection.get(**query_params)
        return _process_history_result(result)

    except Exception as e:
        logger.error(f"History retrieval failed: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={"detail": "Failed to retrieve chat history"}
        )

@router.get("/{item_id}", response_model=ChatHistoryItem)
async def get_history_item(item_id: str):
    """Get specific chat interaction by ID"""
    try:
        # Updated regex pattern
        if not ID_PATTERN.match(item_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid history ID format. Expected format: user_<UUID> or assistant_<UUID>"
            )

        client = get_chroma_client()
        collection = client.get_collection("chat_history")
        
        # Extract UUID regardless of prefix
        uuid_part = item_id.split("_")[1]
        user_id = f"user_{uuid_part}"
        assistant_id = f"assistant_{uuid_part}"
        
        result = collection.get(
            ids=[user_id, assistant_id],
            include=["metadatas", "documents"]
        )

        if len(result.get("ids", [])) != 2:
            raise HTTPException(status_code=404, detail="History item not found")

        return _process_single_item(result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch item {item_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve history item"
        )
    
@router.delete("/{item_id}", status_code=204)
async def delete_history_item(item_id: str):
    """
    Delete a chat history conversation (user & assistant pair) by either user_... or assistant_... ID.
    """
    if not ID_PATTERN.match(item_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid history ID format. Expected format: user_<UUID> or assistant_<UUID>"
        )
    try:
        delete_conversation_by_id(item_id)
        return  # 204 No Content
    except Exception as e:
        logger.error(f"Failed to delete item {item_id}: {str(e)}")
        raise HTTPException(500, "Failed to delete history item")
    
def _process_history_result(result: dict) -> List[ChatHistoryItem]:
    """Process and sort results"""
    items = []
    for i in range(0, len(result.get("ids", [])), 2):
        try:
            if i+1 >= len(result["ids"]):
                logger.warning("Odd number of history items detected")
                break
            items.append(_create_history_item(result, i))
        except (KeyError, IndexError) as e:
            logger.error(f"Malformed history item at index {i}: {str(e)}")
            continue
    
    # Sort by timestamp descending
    items.sort(key=lambda x: x.timestamp, reverse=True)
    return items

def _create_history_item(result: dict, index: int) -> ChatHistoryItem:
    """Create history item from raw data"""
    metadata = result["metadatas"][index] or {}
    tables = metadata.get("tables", [])
    
    # Convert string to list if needed
    if isinstance(tables, str):
        tables = [t.strip() for t in tables.split(",")] if tables else []
    
    return ChatHistoryItem(
        id=result["ids"][index],
        prompt=result["documents"][index],
        response=result["documents"][index+1],
        database=metadata.get("database", "unknown"),
        tables=tables,  # Now guaranteed to be a list
        timestamp=metadata.get("timestamp", datetime.now().isoformat())
    )

def _process_single_item(result: dict) -> ChatHistoryItem:
    """Process single conversation pair with order validation"""
    try:
        # Identify user and assistant indices
        user_idx = None
        assistant_idx = None
        
        for i, item_id in enumerate(result["ids"]):
            if item_id.startswith("user_"):
                user_idx = i
            elif item_id.startswith("assistant_"):
                assistant_idx = i
        
        if user_idx is None or assistant_idx is None:
            raise ValueError("Missing user or assistant message in pair")
        
        # Get metadata from user message
        metadata = result["metadatas"][user_idx] if result["metadatas"] else {}
        
        # Convert tables to list if needed
        tables = metadata.get("tables", [])
        if isinstance(tables, str):
            tables = [t.strip() for t in tables.split(",") if t.strip()]
        
        return ChatHistoryItem(
            id=result["ids"][user_idx],
            prompt=result["documents"][user_idx],
            response=result["documents"][assistant_idx],
            database=metadata.get("database", "unknown"),
            tables=tables,
            timestamp=metadata.get("timestamp", datetime.now().isoformat())
        )
        
    except (KeyError, IndexError, TypeError) as e:
        logger.error(f"Failed to process history item: {str(e)}")
        raise HTTPException(500, "Invalid history item structure")
    except Exception as e:
        logger.error(f"Unexpected error processing item: {str(e)}")
        raise HTTPException(500, "History item processing failed")
