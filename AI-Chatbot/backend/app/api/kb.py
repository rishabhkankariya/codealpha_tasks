from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.auth import get_current_admin
from app.models.database import User, KnowledgeBase
from app.schemas.kb import KBCreate, KBResponse
from app.services.ai_service import ai_service

router = APIRouter(prefix="/kb", tags=["knowledge-base"])

@router.get("", response_model=List[KBResponse])
def get_kb_entries(db: Session = Depends(get_db)):
    """Retrieve all entries in the Knowledge Base (accessible to all authenticated users)"""
    return db.query(KnowledgeBase).order_by(KnowledgeBase.category, KnowledgeBase.id).all()

@router.post("", response_model=KBResponse, status_code=status.HTTP_201_CREATED)
def create_kb_entry(
    payload: KBCreate,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create a new manual FAQ entry in the Knowledge Base (Admin-only)"""
    db_kb = KnowledgeBase(
        category=payload.category,
        question=payload.question,
        answer=payload.answer
    )
    db.add(db_kb)
    db.commit()
    db.refresh(db_kb)
    
    # Rebuild the FAISS index to include the new entry
    ai_service.rebuild_kb_index(db)
    
    return db_kb

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_pdf_knowledge_base(
    file: UploadFile = File(...),
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Upload a PDF document. Extracts text, chunks paragraphs, embeds context, and expands FAISS FAQ matching (Admin-only)."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF documents are supported."
        )
        
    try:
        file_bytes = await file.read()
        inserted_count = ai_service.ingest_pdf(file_bytes, file.filename, db)
        return {
            "message": f"Successfully ingested PDF '{file.filename}'.",
            "inserted_qa_relations": inserted_count
        }
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while parsing the PDF: {str(e)}"
        )

@router.delete("/{kb_id}", status_code=status.HTTP_200_OK)
def delete_kb_entry(
    kb_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete a Knowledge Base entry (Admin-only)"""
    entry = db.query(KnowledgeBase).filter(KnowledgeBase.id == kb_id).first()
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Knowledge Base entry not found."
        )
        
    db.delete(entry)
    db.commit()
    
    # Rebuild the index after removing the entry
    ai_service.rebuild_kb_index(db)
    
    return {"message": "Knowledge Base entry deleted successfully."}
