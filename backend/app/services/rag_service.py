import logging
from typing import List, Dict, Any, Tuple
from app.core.config import settings
from app.services.embeddings import generate_single_embedding, cosine_similarity

logger = logging.getLogger(__name__)


def retrieve_relevant_chunks(
    query: str,
    chunks: List[Any],
    paper_title_map: Dict[str, str],
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Ranks chunks using cosine similarity between query embedding and chunk embeddings.
    """
    if not query or not chunks:
        return []

    query_emb = generate_single_embedding(query)
    scored_chunks = []

    for chunk in chunks:
        score = 0.0
        if chunk.embedding:
            score = cosine_similarity(query_emb, chunk.embedding)
        else:
            # Fallback simple keyword relevance scoring if embedding missing
            q_words = set(query.lower().split())
            c_words = set(chunk.text.lower().split())
            if c_words:
                score = len(q_words.intersection(c_words)) / float(len(q_words))

        paper_title = paper_title_map.get(chunk.paper_id, "Unknown Paper")
        scored_chunks.append({
            "chunk_id": chunk.id,
            "paper_id": chunk.paper_id,
            "paper_title": paper_title,
            "chunk_index": chunk.chunk_index,
            "page_number": chunk.page_number,
            "text": chunk.text,
            "score": score
        })

    scored_chunks.sort(key=lambda x: x["score"], reverse=True)
    return scored_chunks[:top_k]


def generate_rag_response(
    query: str,
    retrieved_chunks: List[Dict[str, Any]],
    chat_history: List[Dict[str, str]] = None
) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Generates an answer using OpenAI if API key present, or intelligent synthesis fallback.
    Returns (answer_string, list_of_citation_sources).
    """
    citations = []
    for c in retrieved_chunks:
        citations.append({
            "paper_id": c["paper_id"],
            "paper_title": c["paper_title"],
            "page_number": c["page_number"],
            "chunk_index": c["chunk_index"],
            "text_snippet": c["text"][:200] + ("..." if len(c["text"]) > 200 else ""),
            "relevance_score": round(c["score"], 4)
        })

    if not retrieved_chunks:
        return "No relevant sections found in the paper library to answer your question.", []

    # 1. Try OpenAI if API key configured
    if settings.OPENAI_API_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=settings.OPENAI_API_KEY)
            
            context_blocks = []
            for idx, c in enumerate(retrieved_chunks, 1):
                context_blocks.append(
                    f"[{idx}] Paper: '{c['paper_title']}' (Page {c['page_number']})\n{c['text']}"
                )
            context_str = "\n\n".join(context_blocks)

            system_prompt = (
                "You are Synapse AI, an expert academic research assistant. "
                "Answer the user's question accurately using ONLY the provided research context. "
                "Cite page numbers and papers using bracketed references like [1], [2]."
            )
            user_prompt = f"Research Context:\n{context_str}\n\nQuestion: {query}"

            messages = [{"role": "system", "content": system_prompt}]
            if chat_history:
                for h in chat_history[-4:]:
                    messages.append({"role": h.get("role", "user"), "content": h.get("content", "")})
            messages.append({"role": "user", "content": user_prompt})

            completion = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.2
            )
            answer = completion.choices[0].message.content
            return answer, citations
        except Exception as e:
            logger.warning(f"OpenAI completion failed: {e}. Falling back to extractive synthesis.")

    # 2. Extractive Synthesis Fallback
    top_chunk = retrieved_chunks[0]
    sec_chunk = retrieved_chunks[1] if len(retrieved_chunks) > 1 else None

    lines = [
        f"Based on **{top_chunk['paper_title']}** (Page {top_chunk['page_number']}):\n",
        f"> \"{top_chunk['text'].strip()}\"\n"
    ]
    if sec_chunk:
        lines.append(f"\nAdditional context from Page {sec_chunk['page_number']}:\n")
        lines.append(f"> \"{sec_chunk['text'].strip()}\"\n")
    
    lines.append("\n*Synthesized from vector search results. Configure `OPENAI_API_KEY` for conversational LLM synthesis.*")
    answer = "".join(lines)
    return answer, citations
