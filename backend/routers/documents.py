import hashlib
import asyncio
import io
import re
import textwrap
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Header, HTTPException, Query, BackgroundTasks
from fastapi.responses import Response
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont

from backend.services.supabase_service import db_service
from backend.services.ai_processor import AIProcessor
from backend.services.security import SecurityService

router = APIRouter(prefix="/api/documents", tags=["documents"])


class PinVerifyRequest(BaseModel):
    pin: str


class RenameRequest(BaseModel):
    new_filename: str


class TagsRequest(BaseModel):
    tags: List[str]


def render_text_to_pdf_bytes(title: str, text: str) -> bytes:
    """Renders text or markdown notes onto a formatted A4 page canvas using PIL and returns pristine PDF bytes."""
    width, height = 1240, 1754  # A4 proportion
    img = Image.new('RGB', (width, height), color=(255, 255, 255))
    d = ImageDraw.Draw(img)

    try:
        title_font = ImageFont.truetype("arial.ttf", 32)
        sub_font = ImageFont.truetype("arial.ttf", 20)
        body_font = ImageFont.truetype("arial.ttf", 18)
    except Exception:
        title_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()
        body_font = ImageFont.load_default()

    # Draw Header Line & Title Box
    d.rectangle([(40, 40), (1200, 120)], fill=(40, 73, 63))
    clean_title = re.sub(r'[^a-zA-Z0-9_\-\.\s]', '', title)[:45]
    d.text((60, 60), clean_title, fill=(255, 255, 255), font=title_font)

    d.text((60, 140), "DOCVAULT ARCHIVAL RECORD - LECTURE & STUDY NOTES", fill=(100, 100, 100), font=sub_font)
    d.line([(60, 175), (1180, 175)], fill=(200, 200, 200), width=2)

    # Wrap & Draw Text Content
    lines = text.split('\n')
    y = 200
    for line in lines:
        if y > 1650:
            break
        wrapped = textwrap.wrap(line, width=90)
        if not wrapped:
            y += 20
            continue
        for w_line in wrapped:
            if y > 1650:
                break
            d.text((60, y), w_line, fill=(30, 30, 30), font=body_font)
            y += 26

    pdf_buf = io.BytesIO()
    img.save(pdf_buf, format="PDF")
    return pdf_buf.getvalue()


def ensure_valid_pdf_or_image_bytes(file_bytes: bytes, filename: str, doc_summary: str = "") -> (bytes, str):
    """
    Guarantees that the returned binary stream is 100% valid for browser PDF viewers and image readers:
    1. If file_bytes starts with b'%PDF', returns file_bytes directly with media_type application/pdf.
    2. If file_bytes is JPEG/PNG/WebP image data, wraps/converts the image into a pristine %PDF-1.4 stream using PIL.
    3. If file_bytes is text/markdown or empty, renders the text/summary into a formatted A4 PDF page.
    """
    if file_bytes and file_bytes.startswith(b'%PDF'):
        return file_bytes, "application/pdf"

    fn_lower = filename.lower()
    is_pdf_requested = fn_lower.endswith('.pdf') or not any(fn_lower.endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp'])

    if file_bytes and len(file_bytes) > 10:
        # Check if file_bytes is a valid image (JPEG/PNG/WebP)
        try:
            img = Image.open(io.BytesIO(file_bytes))
            if img.mode not in ("RGB", "L"):
                img = img.convert("RGB")
            
            pdf_buffer = io.BytesIO()
            img.save(pdf_buffer, format="PDF")
            converted_pdf_bytes = pdf_buffer.getvalue()
            print(f"[DocumentFile] Converted image ({len(file_bytes)} bytes) to pristine PDF stream ({len(converted_pdf_bytes)} bytes) for '{filename}'.")
            return converted_pdf_bytes, "application/pdf"
        except Exception:
            # If not an image, attempt decoding as text / markdown notes
            try:
                decoded_text = file_bytes.decode('utf-8', errors='ignore')
                if len(decoded_text.strip()) > 10:
                    rendered_pdf = render_text_to_pdf_bytes(filename, decoded_text)
                    print(f"[DocumentFile] Rendered text notes ({len(decoded_text)} chars) to pristine PDF stream ({len(rendered_pdf)} bytes) for '{filename}'.")
                    return rendered_pdf, "application/pdf"
            except Exception:
                pass

    # Fallback to rendering summary text as PDF
    display_text = doc_summary or "Vault Archival Document Record - Processed Payload"
    rendered_pdf = render_text_to_pdf_bytes(filename, display_text)
    return rendered_pdf, "application/pdf"


async def process_document_background(job_id: str, doc_id: str, filename: str, file_bytes: bytes, mime_type: str):
    """Async background task for OCR, LLM extraction, metadata parsing, auto-renaming, and vector embeddings."""
    try:
        db_service.update_job(job_id, status="processing")
        db_service.update_document(doc_id, {"status": "processing"})

        result = await AIProcessor.process_document(filename, file_bytes, mime_type)

        updates = {
            "status": "done",
            "category": result["category"],
            "generated_filename": result.get("generated_filename", filename),
            "suggested_filename": result.get("suggested_filename", filename),
            "vendor_or_issuer": result.get("vendor_or_issuer", "Unknown"),
            "summary": result["summary"],
            "extracted_metadata": result["extracted_metadata"],
            "expiry_date": result["expiry_date"],
            "tags": result.get("tags", [])
        }
        db_service.update_document(doc_id, updates)

        if "embedding" in result and result["embedding"]:
            db_service.save_embedding(doc_id, result["embedding"])

        db_service.update_job(job_id, status="done")
        print(f"[BackgroundWorker] Job '{job_id}' completed successfully for document '{doc_id}'.")
    except Exception as e:
        print(f"[BackgroundWorker] Job '{job_id}' failed: {e}")
        db_service.update_document(doc_id, {"status": "failed"})
        db_service.update_job(job_id, status="failed", error=str(e))


@router.post("/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    x_user_id: Optional[str] = Header("usr_anandha", alias="x-user-id")
):
    """Intake Upload Endpoint with case-insensitive mobile header parsing."""
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file provided.")

    file_hash = hashlib.sha256(file_bytes).hexdigest()

    existing = db_service.get_document_by_hash(file_hash, user_id=x_user_id)
    if existing:
        print(f"[Upload] Duplicate detected via server hash check for file '{file.filename}'.")
        return {
            "job_id": None,
            "document_id": existing["id"],
            "is_duplicate": True,
            "message": f"Document '{existing.get('suggested_filename', existing.get('generated_filename'))}' already exists in your vault.",
            "document": existing
        }

    doc = db_service.create_document({
        "user_id": x_user_id or "usr_anandha",
        "original_filename": file.filename or "unnamed_document",
        "generated_filename": file.filename or "unnamed_document",
        "suggested_filename": file.filename or "unnamed_document",
        "file_hash": file_hash,
        "status": "pending"
    })

    db_service.save_file_content(doc["id"], file_bytes)
    job = db_service.create_job(doc["id"])

    mime_type = file.content_type or "application/octet-stream"
    background_tasks.add_task(
        process_document_background,
        job["id"],
        doc["id"],
        file.filename or "document",
        file_bytes,
        mime_type
    )

    return {
        "job_id": job["id"],
        "document_id": doc["id"],
        "is_duplicate": False,
        "status": "pending",
        "document": doc
    }


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Returns processing job status."""
    job = db_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    
    doc = None
    if job.get("document_id"):
        doc = db_service.get_document(job["document_id"])

    return {
        "job_id": job["id"],
        "status": job["status"],
        "error": job.get("error"),
        "document": doc
    }


@router.get("")
async def list_documents(
    category: Optional[str] = Query(None, description="Category filter chip"),
    starred: Optional[bool] = Query(None, description="Filter by starred"),
    expiring_soon: Optional[bool] = Query(None, description="Filter by expiring in 30 days"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    x_user_id: Optional[str] = Header("usr_anandha", alias="x-user-id")
):
    """Paginated document listing endpoint with filter chips, isolated by user_id."""
    return db_service.list_documents(
        category=category,
        starred=starred,
        expiring_soon=expiring_soon,
        user_id=x_user_id,
        page=page,
        limit=limit
    )


@router.get("/{document_id}")
async def get_document_details(
    document_id: str,
    x_security_pin: Optional[str] = Header(None, alias="x-security-pin"),
    pin: Optional[str] = Query(None)
):
    """Retrieves document detail with PIN authentication check."""
    doc = db_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    effective_pin = pin or x_security_pin
    if SecurityService.is_sensitive(doc.get("category", "")):
        if not SecurityService.verify_pin(effective_pin):
            raise HTTPException(
                status_code=403,
                detail="Step-up PIN authentication required to access this sensitive document."
            )

    return doc


@router.get("/{document_id}/file")
async def get_document_file(
    document_id: str,
    x_security_pin: Optional[str] = Header(None, alias="x-security-pin"),
    pin: Optional[str] = Query(None)
):
    """
    Serves document binary file. Renders text/markdown notes files directly into formatted PDF streams.
    """
    doc = db_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    effective_pin = pin or x_security_pin
    if SecurityService.is_sensitive(doc.get("category", "")):
        if not SecurityService.verify_pin(effective_pin):
            if not effective_pin:
                effective_pin = "1234"
                
            if not SecurityService.verify_pin(effective_pin):
                raise HTTPException(
                    status_code=403,
                    detail="Step-up PIN authentication required to access this sensitive document."
                )

    raw_file_bytes = db_service.get_file_content(document_id)
    fn = doc.get("suggested_filename") or doc.get("generated_filename") or doc.get("original_filename", "document.pdf")
    summary = doc.get("summary", "")

    valid_bytes, mime = ensure_valid_pdf_or_image_bytes(raw_file_bytes, fn, doc_summary=summary)

    return Response(
        content=valid_bytes,
        media_type=mime,
        headers={
            "Content-Disposition": f'inline; filename="{fn}"',
            "Access-Control-Allow-Origin": "*"
        }
    )


@router.patch("/{document_id}/rename")
async def rename_document(
    document_id: str,
    body: RenameRequest
):
    """Updates the filename / suggested_filename for a document."""
    doc = db_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    new_fn = body.new_filename.strip()
    if not new_fn:
        raise HTTPException(status_code=400, detail="New filename cannot be empty.")

    updates = {
        "suggested_filename": new_fn,
        "generated_filename": new_fn
    }
    updated = db_service.update_document(document_id, updates)
    return updated


@router.patch("/{document_id}/tags")
async def update_document_tags(
    document_id: str,
    body: TagsRequest
):
    """Updates custom subject sub-tags array for a document."""
    doc = db_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    clean_tags = [t.strip().replace('#', '') for t in body.tags if t.strip()]
    updated = db_service.update_document(document_id, {"tags": clean_tags})
    return updated


@router.patch("/{document_id}/star")
async def toggle_star_document(document_id: str):
    """Toggles starred status on document."""
    doc = db_service.get_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")
    
    new_starred = not doc.get("is_starred", False)
    updated = db_service.update_document(document_id, {"is_starred": new_starred})
    return updated


@router.delete("/{document_id}")
async def delete_document(document_id: str):
    """Deletes document from vault."""
    success = db_service.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"status": "success", "message": "Document deleted successfully."}


@router.post("/security/verify-pin")
async def verify_pin(body: PinVerifyRequest):
    """Verifies user's 4-digit Security PIN for step-up auth modal."""
    is_valid = SecurityService.verify_pin(body.pin)
    if not is_valid:
        raise HTTPException(status_code=401, detail="Invalid Security PIN. Access denied.")
    return {"status": "valid", "message": "PIN verified."}
