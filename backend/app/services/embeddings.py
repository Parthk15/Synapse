import logging
from typing import List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

# Global model instance lazy-loader for sentence-transformers
_st_model = None


def get_sentence_transformer():
    global _st_model
    if _st_model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _st_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        except Exception as e:
            logger.warning(f"Could not load sentence-transformer model {settings.EMBEDDING_MODEL}: {e}")
            _st_model = False
    return _st_model if _st_model else None


def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generates embedding vectors for a list of texts using SentenceTransformers, OpenAI, or fallback.
    """
    if not texts:
        return []

    # 1. Try OpenAI if API key present
    if settings.OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            response = client.embeddings.create(
                input=texts,
                model="text-embedding-3-small"
            )
            return [data.embedding for data in response.data]
        except Exception as e:
            logger.warning(f"OpenAI embedding generation failed: {e}. Falling back to local model.")

    # 2. Try SentenceTransformers locally
    st_model = get_sentence_transformer()
    if st_model:
        try:
            embeddings = st_model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"SentenceTransformers embedding failed: {e}")

    # 3. Deterministic Fallback Vector (ensures offline pipeline never crashes)
    logger.warning("Using fallback vector generator")
    import numpy as np
    results = []
    for text in texts:
        # Create deterministic pseudo-random 384-dim vector from text hash
        np.random.seed(abs(hash(text)) % (2**32))
        vec = np.random.normal(0, 1, settings.EMBEDDING_DIM)
        norm = np.linalg.norm(vec)
        normalized = (vec / norm).tolist() if norm > 0 else vec.tolist()
        results.append(normalized)
    return results


def generate_single_embedding(text: str) -> List[float]:
    embeddings = generate_embeddings([text])
    return embeddings[0] if embeddings else [0.0] * settings.EMBEDDING_DIM


def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
    """
    Calculates cosine similarity between two float vectors.
    Returns a value between -1.0 and 1.0 (higher = more similar).
    """
    if not vec_a or not vec_b or len(vec_a) != len(vec_b):
        return 0.0
    import numpy as np
    a = np.array(vec_a, dtype=np.float32)
    b = np.array(vec_b, dtype=np.float32)
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))

