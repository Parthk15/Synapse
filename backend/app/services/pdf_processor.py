"""
pdf_processor.py
----------------
Handles page-aware text extraction and chunking of PDF files using PyMuPDF (fitz).

Each chunk preserves its originating page_number so downstream retrieval can
cite exact source pages. Chunks are capped at ~400 words with a 50-word overlap
to maintain context across chunk boundaries.
"""
import fitz  # PyMuPDF
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


def extract_pages_and_chunk(file_path: str, target_chunk_size: int = 400, overlap: int = 50) -> Dict[str, Any]:
    """
    Extracts text page-by-page from a PDF using PyMuPDF (fitz) and creates chunks
    that strictly maintain page_number mapping.
    
    Returns a dictionary containing page count and chunks list.
    """
    try:
        doc = fitz.open(file_path)
    except Exception as e:
        logger.error(f"Failed to open PDF file {file_path}: {e}")
        raise ValueError(f"Could not open PDF file: {str(e)}")

    page_count = len(doc)
    chunks: List[Dict[str, Any]] = []
    global_chunk_index = 0

    for page_idx in range(page_count):
        page_num = page_idx + 1
        page = doc.load_page(page_idx)
        text = page.get_text("text").strip()

        if not text:
            continue

        # Split page text into words for page-aware chunking
        words = text.split()
        if len(words) <= target_chunk_size:
            chunks.append({
                "chunk_index": global_chunk_index,
                "page_number": page_num,
                "text": text
            })
            global_chunk_index += 1
        else:
            # Slice words into overlapping chunks within the page
            start = 0
            while start < len(words):
                end = min(start + target_chunk_size, len(words))
                chunk_words = words[start:end]
                chunk_text = " ".join(chunk_words)

                chunks.append({
                    "chunk_index": global_chunk_index,
                    "page_number": page_num,
                    "text": chunk_text
                })
                global_chunk_index += 1

                if end == len(words):
                    break
                start += target_chunk_size - overlap

    doc.close()

    return {
        "page_count": page_count,
        "chunks": chunks
    }
