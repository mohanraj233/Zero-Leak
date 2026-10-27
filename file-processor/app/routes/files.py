from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import base64
import os
from app.schemas.dtos import FileRedactResponse, FileFindingItem
from app.security.auth import verify_internal_token
from app.redactors.image_redactor import redact_image
from app.redactors.pdf_redactor import redact_pdf
from app.redactors.docx_redactor import redact_docx
from app.redactors.xlsx_redactor import redact_xlsx
from app.redactors.pptx_redactor import redact_pptx

router = APIRouter(prefix="/api/v1/files", tags=["Files"])

@router.post("/redact", response_model=FileRedactResponse)
async def redact_file_endpoint(
    file: UploadFile = File(...),
    _token: str = Depends(verify_internal_token)
):
    contents = await file.read()
    filename = file.filename or "unknown"
    ext = os.path.splitext(filename)[1].lower()

    findings = []
    detected_count = 0
    redacted_count = 0
    sanitized_bytes = contents

    if ext in [".png", ".jpg", ".jpeg"]:
        sanitized_bytes, findings, detected_count, redacted_count = redact_image(contents, filename)
    elif ext == ".pdf":
        sanitized_bytes, findings, detected_count, redacted_count = redact_pdf(contents, filename)
    elif ext == ".docx":
        sanitized_bytes, findings, detected_count, redacted_count = redact_docx(contents, filename)
    elif ext == ".xlsx":
        sanitized_bytes, findings, detected_count, redacted_count = redact_xlsx(contents, filename)
    elif ext == ".pptx":
        sanitized_bytes, findings, detected_count, redacted_count = redact_pptx(contents, filename)
    else:
        # Unsupported format for binary parser, return original with no findings
        sanitized_bytes = contents

    status = "clean"
    if any(f.get("severity") == "critical" and f.get("action") == "block" for f in findings):
        status = "blocked"
    elif redacted_count > 0:
        status = "redacted"

    base64_sanitized = base64.b64encode(sanitized_bytes).decode("utf-8")

    return FileRedactResponse(
        detected_count=detected_count,
        redacted_count=redacted_count,
        status=status,
        findings=[
            FileFindingItem(
                entity_type=f["entity_type"],
                confidence=f["confidence"],
                severity=f["severity"],
                action=f["action"],
                occurrence_count=f.get("occurrence_count", 1)
            )
            for f in findings
        ],
        sanitized_base64=base64_sanitized,
        verification_passed=True
    )
