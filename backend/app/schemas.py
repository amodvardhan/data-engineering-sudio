from pydantic import BaseModel, Field
from typing import List

class DBConnectionRequest(BaseModel):
    db_type: str = Field(..., example="postgres")
    host: str = Field(..., example="localhost")
    username: str = Field(..., example="admin")
    password: str = Field(..., example="securepassword")
    database_name: str = Field(..., example="mydb")

class AnalyzeSchemaRequest(DBConnectionRequest):
    prompt: str = Field(..., example="Generate optimized star schema")
    selected_tables: List[str] = Field(..., example=["orders", "customers"])

class ChatHistoryItem(BaseModel):
    id: str  # Unique identifier for the history item
    prompt: str  # User's query or request
    response: str  # Assistant's response
    database: str  # Database associated with the query
    tables: List[str]  # Tables involved in the query
    timestamp: str  # Timestamp when the interaction occurred