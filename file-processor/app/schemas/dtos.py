from pydantic import BaseModel, Field
from typing import List, Optional, Any

class AnalyzeRequest(BaseModel):
    text: str = Field(..., max_length=100000)
    language: str = "en"

class AnalyzeResultItem(BaseModel):
    entity_type: str
    start: int
    end: int
    score: float
    analysis_explanation: Optional[Any] = None

class FileFindingItem(BaseModel):
    entity_type: str
    confidence: float
    severity: str
    action: str
    occurrence_count: int = 1

class FileRedactResponse(BaseModel):
    detected_count: int
    redacted_count: int
    status: str
    findings: List[FileFindingItem]
    sanitized_base64: Optional[str] = None
    verification_passed: bool = True
