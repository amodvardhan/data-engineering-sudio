from fastapi import HTTPException
import pyodbc
import psycopg2
import mysql.connector
from typing import List, Union
import logging
logger = logging.getLogger(__name__)

def get_database_connection(db_type: str, host: str, username: str, password: str, database_name: str) -> Union[pyodbc.Connection, psycopg2.extensions.connection, mysql.connector.MySQLConnection]:
    try:
        logger.debug(f"Attempting to connect: db_type={db_type}, host={host}, database={database_name}")
        if db_type.lower() == "sqlserver":
            connection = pyodbc.connect(
                f"DRIVER={{ODBC Driver 17 for SQL Server}};"
                f"SERVER={host};"
                f"DATABASE={database_name};"
                f"UID={username};"
                f"PWD={password}"
            )
        elif db_type.lower() == "postgres":
            connection = psycopg2.connect(
                dbname=database_name,
                user=username,
                password=password,
                host=host
            )
        elif db_type.lower() == "mysql":
            connection = mysql.connector.connect(
                user=username,
                password=password,
                host=host,
                database=database_name
            )
        else:
            raise ValueError("Unsupported database type. Choose 'sqlserver', 'postgres', or 'mysql'.")
        
        print(f"Connected to {db_type} successfully!")
        return connection
    
    except Exception as e:
         logger.error(f"Error connecting to database: {e}", exc_info=True)
         raise 

def get_databases(db_type: str, host: str, username: str, password: str) -> List[str]:
    """Fetch list of databases from the connected server with full observability."""
    conn = None
    cursor = None
    try:
        logger.info(
            f"Fetching databases | db_type: {db_type}, host: {host}, user: {username}"
        )
        
        # Connect to system database based on DB type
        system_db = "master" if db_type == "sqlserver" else "postgres"
        conn = get_database_connection(db_type, host, username, password, system_db)
        cursor = conn.cursor()
        
        logger.debug("Executing database query")
        if db_type == "sqlserver":
            query = "SELECT name FROM sys.databases WHERE database_id > 4"  # Exclude system DBs
        elif db_type == "postgres":
            query = "SELECT datname FROM pg_database WHERE datistemplate = false"
        elif db_type == "mysql":
            query = "SHOW DATABASES"
        else:
            raise ValueError(f"Unsupported database type: {db_type}")
            
        cursor.execute(query)
        databases = [row[0] for row in cursor.fetchall()]
        
        logger.info(f"Successfully fetched {len(databases)} databases")
        return databases
        
    except Exception as e:
        logger.error(
            f"Database fetch failed | db_type: {db_type}, host: {host}, error: {str(e)}",
            exc_info=True
        )
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            logger.debug("Database connection closed")

def get_tables(db_type: str, host: str, username: str, password: str, database_name: str) -> List[str]:
    """Fetch tables from a selected database with proper resource handling."""
    conn = None
    cursor = None
    try:
        logger.info(
            f"Fetching tables | db_type: {db_type}, db: {database_name}, host: {host}"
        )
        
        conn = get_database_connection(db_type, host, username, password, database_name)
        cursor = conn.cursor()
        
        logger.debug("Executing tables query")
        if db_type == "sqlserver":
            query = """SELECT table_name 
                      FROM information_schema.tables 
                      WHERE table_type = 'BASE TABLE'"""
        elif db_type in ["postgres", "mysql"]:
            query = """SELECT table_name 
                      FROM information_schema.tables 
                      WHERE table_schema = 'public'"""
        else:
            raise ValueError(f"Unsupported database type: {db_type}")
            
        cursor.execute(query)
        tables = [row[0] for row in cursor.fetchall()]
        
        logger.info(f"Found {len(tables)} tables in {database_name}")
        return tables
        
    except Exception as e:
        logger.error(
            f"Table fetch failed | db: {database_name}, error: {str(e)}",
            exc_info=True
        )
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            logger.debug("Table connection closed")

def get_table_schemas(db_type: str, host: str, username: str, password: str, 
                     database_name: str, tables: List[str]) -> dict:
    """Fetch detailed schema information for specified tables."""
    conn = None
    cursor = None
    try:
        logger.info(
            f"Fetching schema details | db: {database_name}, tables: {len(tables)}"
        )
        
        conn = get_database_connection(db_type, host, username, password, database_name)
        cursor = conn.cursor()
        
        schemas = {}
        for table in tables:
            logger.debug(f"Processing table: {table}")
            if db_type == "sqlserver":
                cursor.execute(f"""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = '{table}'
                    ORDER BY ordinal_position
                """)
            elif db_type == "postgres":
                cursor.execute(f"""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = '{table}'
                    AND table_schema = 'public'
                    ORDER BY ordinal_position
                """)
            elif db_type == "mysql":
                cursor.execute(f"""
                    SELECT column_name, data_type, is_nullable
                    FROM information_schema.columns
                    WHERE table_name = '{table}'
                    ORDER BY ordinal_position
                """)
                
            schemas[table] = [
                {"name": row[0], "type": row[1], "nullable": row[2] == 'YES'}
                for row in cursor.fetchall()
            ]
            
        logger.info(f"Retrieved schemas for {len(schemas)} tables")
        return schemas
        
    except Exception as e:
        logger.error(
            f"Schema fetch failed | db: {database_name}, error: {str(e)}",
            exc_info=True
        )
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            logger.debug("Schema connection closed")