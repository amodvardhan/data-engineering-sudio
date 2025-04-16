from sentence_transformers import SentenceTransformer

# Load once at startup
embedder = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> list[float]:
    return embedder.encode(text).tolist()
