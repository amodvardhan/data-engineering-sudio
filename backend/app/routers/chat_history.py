# routers/chat_history.py
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
from app.utils.vector_db import get_chroma_client
from app.schemas import ChatHistoryItem
import logging
import re

router = APIRouter(prefix="/api/chat-history", tags=["Chat History"])
logger = logging.getLogger("schema_verification.api")

ID_PATTERN = re.compile(r"^user_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")

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
        if not ID_PATTERN.match(item_id):
            raise HTTPException(
                status_code=400,
                detail="Invalid history ID format. Expected format: user_<UUID>"
            )

        client = get_chroma_client()
        collection = client.get_collection("chat_history")
        
        assistant_id = f"assistant_{item_id.split('_')[1]}"
        result = collection.get(
            ids=[item_id, assistant_id],
            include=["metadatas", "documents"]
        )

        if not result["ids"]:
            raise HTTPException(status_code=404, detail="History item not found")

        return _process_single_item(result, item_id)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch item {item_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve history item"
        )

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

def _process_single_item(result: dict, item_id: str) -> ChatHistoryItem:
    """Validate single item structure"""
    if len(result["ids"]) != 2:
        logger.error(f"Unexpected item count for {item_id}: {len(result['ids'])}")
        raise HTTPException(500, "Invalid history item structure")

    if not result["ids"][0].startswith("user_"):
        logger.error(f"Invalid ID order for {item_id}")
        raise HTTPException(500, "Invalid history item format")

    metadata = result["metadatas"][0] or {}
    tables = metadata.get("tables", [])
    
    # Convert string to list if needed
    if isinstance(tables, str):
        tables = [t.strip() for t in tables.split(",")] if tables else []
    
    return ChatHistoryItem(
        id=result["ids"][0],
        prompt=result["documents"][0],
        response=result["documents"][1],
        database=metadata.get("database", "unknown"),
        tables=tables,  # Now guaranteed to be a list
        timestamp=metadata.get("timestamp", datetime.now().isoformat())
    )