from fastapi import FastAPI
from app.routers import database_router
from fastapi.middleware.cors import CORSMiddleware

from app.routers import chat_history

app = FastAPI(title="Schema Verification Tool")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Add your React dev server port(s)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(database_router.router)
app.include_router(chat_history.router)

@app.get("/")
def read_root():
    return {"message": "Schema Verification Tool is running!"}
