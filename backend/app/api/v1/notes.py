from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import User
from app.models.paper import Paper
from app.models.note import PaperNote
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse
from app.api.deps import get_current_user

router = APIRouter(tags=["Notes"])


@router.get("/papers/{paper_id}/notes", response_model=List[NoteResponse])
def get_paper_notes(
    paper_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == current_user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    notes = db.query(PaperNote).filter(
        PaperNote.paper_id == paper_id,
        PaperNote.user_id == current_user.id
    ).order_by(PaperNote.created_at.desc()).all()
    return notes


@router.post("/papers/{paper_id}/notes", response_model=NoteResponse, status_code=status.HTTP_201_CREATED)
def create_paper_note(
    paper_id: str,
    req: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    paper = db.query(Paper).filter(Paper.id == paper_id, Paper.user_id == current_user.id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    note = PaperNote(
        paper_id=paper_id,
        user_id=current_user.id,
        page_number=req.page_number,
        content=req.content
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/notes/{note_id}", response_model=NoteResponse)
def update_paper_note(
    note_id: str,
    req: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(PaperNote).filter(PaperNote.id == note_id, PaperNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if req.content is not None:
        note.content = req.content
    if req.page_number is not None:
        note.page_number = req.page_number

    db.commit()
    db.refresh(note)
    return note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paper_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    note = db.query(PaperNote).filter(PaperNote.id == note_id, PaperNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(note)
    db.commit()
    return None
