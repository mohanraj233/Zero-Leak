from fastapi import APIRouter, Depends
from typing import List
from app.schemas.dtos import AnalyzeRequest, AnalyzeResultItem
from app.detectors.presidio_detector import analyze_text
from app.security.auth import verify_internal_token

router = APIRouter(prefix="/api/v1/presidio", tags=["Presidio"])

@router.post("/analyze", response_model=List[AnalyzeResultItem])
def analyze_endpoint(
    req: AnalyzeRequest,
    _token: str = Depends(verify_internal_token)
):
    results = analyze_text(req.text, req.language)
    return [
        AnalyzeResultItem(
            entity_type=r["entity_type"],
            start=r["start"],
            end=r["end"],
            score=r["score"]
        )
        for r in results
    ]
