from fastapi import APIRouter
import shutil

router = APIRouter()

@router.get("/health")
def health_check():
    tesseract_available = shutil.which("tesseract") is not None
    return {
        "status": "healthy",
        "service": "ZeroLeak File Processing & Presidio Microservice",
        "ocr_available": tesseract_available,
        "supported_formats": ["pdf", "png", "jpg", "jpeg", "docx", "xlsx", "pptx"]
    }
