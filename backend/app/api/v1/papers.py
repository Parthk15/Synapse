import os
import shutil
import uuid
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.db.database import get_db, SessionLocal
from app.models.user import User
from app.models.paper import Paper, PaperChunk
from app.schemas.paper import PaperResponse, PaperDetailResponse
from app.api.deps import get_current_user
from app.core.config import settings
from app.services.pdf_processor import extract_pages_and_chunk
from app.services.embeddings import generate_embeddings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/papers", tags=["Papers"])


def process_paper_background(paper_id: str, file_path: str):
    """
    Background worker task to extract PDF text page-by-page, chunk it, generate embeddings,
    and update paper status in the database.
    """
    db: Session = SessionLocal()
    try:
        paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            logger.error(f"Paper {paper_id} not found for background processing")
            return

        logger.info(f"Starting background processing for paper: {paper.title} ({paper_id})")
        
        # 1. Extract pages and chunk text
        extracted_data = extract_pages_and_chunk(file_path)
        page_count = extracted_data["page_count"]
        chunks_data = extracted_data["chunks"]

        if not chunks_data:
            paper.status = "failed"
            paper.error_message = "No readable text found in PDF document"
            db.commit()
            return

        # 2. Generate embeddings for all text chunks
        texts = [chunk["text"] for chunk in chunks_data]
        embeddings = generate_embeddings(texts)

        # 3. Create PaperChunk records
        db_chunks = []
        for idx, chunk_info in enumerate(chunks_data):
            emb = embeddings[idx] if idx < len(embeddings) else None
            chunk_record = PaperChunk(
                paper_id=paper_id,
                chunk_index=chunk_info["chunk_index"],
                page_number=chunk_info["page_number"],
                text=chunk_info["text"],
                embedding=emb
            )
            db_chunks.append(chunk_record)

        db.bulk_save_objects(db_chunks)

        # 4. Update paper metadata & status
        paper.page_count = page_count
        paper.status = "ready"
        paper.error_message = None
        db.commit()
        logger.info(f"Successfully processed paper {paper_id} with {len(db_chunks)} chunks across {page_count} pages.")

    except Exception as e:
        logger.error(f"Error processing paper {paper_id}: {e}", exc_info=True)
        try:
            paper = db.query(Paper).filter(Paper.id == paper_id).first()
            if paper:
                paper.status = "failed"
                paper.error_message = f"Processing error: {str(e)}"
                db.commit()
        except Exception as inner_e:
            logger.error(f"Failed to record failure status for paper {paper_id}: {inner_e}")
    finally:
        db.close()


@router.post("/upload", response_model=PaperResponse, status_code=status.HTTP_202_ACCEPTED)
def upload_paper(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )

    # Enforce a 50 MB upload limit
    MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)     # Reset to start
    if file_size > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum allowed size is 50 MB (got {file_size / 1024 / 1024:.1f} MB)."
        )

    paper_id = str(uuid.uuid4())
    user_upload_dir = os.path.join(settings.UPLOAD_DIR, current_user.id)
    os.makedirs(user_upload_dir, exist_ok=True)

    safe_filename = os.path.basename(file.filename)
    file_path = os.path.join(user_upload_dir, f"{paper_id}_{safe_filename}")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    paper_title = safe_filename.rsplit(".", 1)[0].replace("_", " ").replace("-", " ").title()

    paper = Paper(
        id=paper_id,
        user_id=current_user.id,
        title=paper_title,
        filename=safe_filename,
        storage_path=file_path,
        status="processing",
        page_count=0
    )
    db.add(paper)
    db.commit()
    db.refresh(paper)

    # Schedule background extraction and embedding task
    background_tasks.add_task(process_paper_background, paper_id=paper_id, file_path=file_path)

    return paper


@router.get("", response_model=List[PaperResponse])
def list_papers(
    status_filter: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all papers for the authenticated user.
    Optionally filter by processing status via ?status_filter=<value>
    (e.g. ready, processing, failed).
    """
    query = db.query(Paper).filter(Paper.user_id == current_user.id)
    if status_filter:
        query = query.filter(Paper.status == status_filter)
    papers = query.order_by(Paper.uploaded_at.desc()).all()
    return papers


@router.get("/{paper_id}", response_model=PaperDetailResponse)
def get_paper(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == current_user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    chunks_count = db.query(PaperChunk).filter(PaperChunk.paper_id == paper_id).count()

    return PaperDetailResponse(
        id=paper.id,
        user_id=paper.user_id,
        title=paper.title,
        filename=paper.filename,
        status=paper.status,
        page_count=paper.page_count,
        error_message=paper.error_message,
        uploaded_at=paper.uploaded_at,
        chunks_count=chunks_count
    )


@router.delete("/{paper_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paper(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == current_user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    # Remove physical file if exists
    if os.path.exists(paper.storage_path):
        try:
            os.remove(paper.storage_path)
        except Exception as e:
            logger.warning(f"Could not delete physical file {paper.storage_path}: {e}")

    db.delete(paper)
    db.commit()
    return None
