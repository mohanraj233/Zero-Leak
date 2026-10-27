from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.health import router as health_router
from app.routes.presidio import router as presidio_router
from app.routes.files import router as files_router

app = FastAPI(
    title="ZeroLeak File Processing & Presidio Microservice",
    description="Internal microservice for Microsoft Presidio PII analysis and format-specific permanent redaction of PDF, Images, DOCX, XLSX, PPTX.",
    version="2.4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(presidio_router)
app.include_router(files_router)

if __name__ == "__main__":
    import uvicorn
    from app.config import settings
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
