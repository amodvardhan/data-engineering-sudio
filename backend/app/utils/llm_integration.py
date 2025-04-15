import ollama
import logging

logger = logging.getLogger("schema_verification.llm")

def analyze_schema(prompt: str, schema_info: str, selected_tables: list[str], database_name: str):
    """
    Industry Standard LLM Integration:
    - Context engineering
    - Response validation
    - Error handling
    """
    try:
        logger.info(f"Starting analysis for {database_name} (tables: {selected_tables})")
        
        # System message sets the LLM's role
        system_prompt = """You are a senior data architect specializing in modern data warehouses. 
        Follow these rules:
        1. Always generate ANSI-SQL DDL statements
        2. Use star/snowflake schemas where appropriate
        3. Add primary/foreign keys
        4. Include indexes for frequent query columns
        5. Add comments to columns/tables"""
        
        # User message combines prompt + schema
        user_prompt = f"""
        User Request: {prompt}
        Database: {database_name}
        Tables: {', '.join(selected_tables)}
        Schema Details: {schema_info}"""
        
        response = ollama.chat(
            model="llama3.2",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            options={
                "temperature": 0.3,  # Less creative, more factual
                "num_ctx": 4096       # Larger context window
            }
        )
        
        # Validate response
        if not response.get('message') or not response['message'].get('content'):
            raise ValueError("Invalid LLM response structure")
        
        # Parse and return
        return {
            "analysis": response['message']['content'],
            "ddl": _extract_ddl(response['message']['content'])
        }
        
    except Exception as e:
        logger.error(f"LLM analysis failed: {str(e)} | Input: {user_prompt}", exc_info=True)
        raise

def _extract_ddl(response: str) -> list[str]:
    """Helper to extract DDL statements from LLM response"""
    return [line.strip() for line in response.split(';') if "CREATE TABLE" in line.upper()]
