import pytest
from app.services.embeddings import cosine_similarity, generate_embeddings
from app.services.rag_service import retrieve_relevant_chunks, generate_rag_response


def test_cosine_similarity():
    vec1 = [1.0, 0.0, 0.0]
    vec2 = [1.0, 0.0, 0.0]
    vec3 = [0.0, 1.0, 0.0]

    assert abs(cosine_similarity(vec1, vec2) - 1.0) < 1e-5
    assert abs(cosine_similarity(vec1, vec3) - 0.0) < 1e-5
    assert cosine_similarity([], []) == 0.0


def test_embedding_generation():
    texts = ["Quantum entanglement in neural networks", "Deep learning optimization"]
    embeddings = generate_embeddings(texts)

    assert len(embeddings) == 2
    assert len(embeddings[0]) > 0


class DummyChunk:
    def __init__(self, id, paper_id, chunk_index, page_number, text, embedding):
        self.id = id
        self.paper_id = paper_id
        self.chunk_index = chunk_index
        self.page_number = page_number
        self.text = text
        self.embedding = embedding


def test_retrieve_relevant_chunks():
    emb1 = generate_embeddings(["Transformer self-attention mechanism"])[0]
    emb2 = generate_embeddings(["Convolutional neural networks for vision"])[0]

    chunks = [
        DummyChunk("c1", "p1", 0, 1, "Transformer self-attention mechanism", emb1),
        DummyChunk("c2", "p1", 1, 2, "Convolutional neural networks for vision", emb2),
    ]

    title_map = {"p1": "Attention Is All You Need"}
    results = retrieve_relevant_chunks("self attention transformer", chunks, title_map, top_k=1)

    assert len(results) == 1
    assert results[0]["page_number"] == 1


def test_rag_response_fallback():
    retrieved = [
        {
            "chunk_id": "c1",
            "paper_id": "p1",
            "paper_title": "Attention Is All You Need",
            "chunk_index": 0,
            "page_number": 3,
            "text": "The Transformer uses multi-head attention to compute representation.",
            "score": 0.92
        }
    ]

    answer, citations = generate_rag_response("What does Transformer use?", retrieved)
    assert "Attention Is All You Need" in answer
    assert len(citations) == 1
    assert citations[0]["page_number"] == 3
