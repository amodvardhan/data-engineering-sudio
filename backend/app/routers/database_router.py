from fastapi import APIRouter, HTTPException, status
from app.database import get_database_connection, get_databases, get_tables, get_table_schemas
from app.schemas import DBConnectionRequest, AnalyzeSchemaRequest
from app.utils.llm_integration import analyze_schema
import logging

logger = logging.getLogger("schema_verification.database_router")

router = APIRouter(prefix="/database", tags=["Database"])

@router.post("/connect", status_code=status.HTTP_200_OK)
async def connect_to_database(request: DBConnectionRequest):
    """Test database connection."""
    logger.info(f"Received connection request for {request.db_type}@{request.host}, db: {request.database_name}")
    try:
        connection = get_database_connection(
            request.db_type,
            request.host,
            request.username,
            request.password,
            request.database_name
        )
        connection.close()
        logger.info(f"Successfully connected to {request.db_type}@{request.host}, db: {request.database_name}")
        return {"message": f"Connected to {request.db_type} database!"}
    except Exception as e:
        logger.error(f"Failed to connect to {request.db_type}@{request.host}, db: {request.database_name}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database connection failed. Please check your credentials and connection details."
        )

@router.post("/databases/", status_code=status.HTTP_200_OK)
async def list_databases(request: DBConnectionRequest):
    """Fetch all databases under the connected server."""
    logger.info(f"Listing databases for {request.db_type}@{request.host}")
    try:
        databases = get_databases(
            request.db_type,
            request.host,
            request.username,
            request.password
        )
        logger.debug(f"Found {len(databases)} databases")
        return {"databases": databases}
    except Exception as e:
        logger.error(f"Database listing failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database listing service unavailable"
        )

@router.post("/tables/{database_name}", status_code=status.HTTP_200_OK)
async def list_tables(database_name: str, request: DBConnectionRequest):
    """Fetch tables in a selected database."""
    logger.info(f"Listing tables in {database_name}")
    try:
        tables = get_tables(
            request.db_type,
            request.host,
            request.username,
            request.password,
            database_name
        )
        logger.debug(f"Found {len(tables)} tables in {database_name}")
        return {"tables": tables}
    except Exception as e:
        logger.error(f"Table listing failed: {str(e)} | DB: {database_name}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid database or insufficient privileges"
        )

@router.post("/analyze-schema/", status_code=status.HTTP_201_CREATED)
async def analyze_schema_endpoint(request: AnalyzeSchemaRequest):
    """Enterprise-grade schema analysis endpoint."""
    logger.info(f"Schema analysis started for {request.database_name} (tables: {request.selected_tables})")
    try:
        # Fetch detailed schema info for selected tables
        schema_info = get_table_schemas(
            request.db_type,
            request.host,
            request.username,
            request.password,
            request.database_name,
            request.selected_tables
        )
        result = analyze_schema(
            prompt=request.prompt,
            schema_info=schema_info,
            selected_tables=request.selected_tables,
            database_name=request.database_name
        )
        logger.info(f"Analysis completed for {request.database_name}")
        return result
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)} | Input: {request.model_dump()}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Schema analysis failed. Please validate inputs and try again."
        )
