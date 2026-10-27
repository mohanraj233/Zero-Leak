from typing import List, Dict, Any
from app.detectors.regex_detector import scan_text_patterns

# Attempt to load Presidio Analyzer Engine
analyzer = None
try:
    from presidio_analyzer import AnalyzerEngine
    analyzer = AnalyzerEngine()
except Exception:
    analyzer = None

def analyze_text(text: str, language: str = "en") -> List[Dict[str, Any]]:
    regex_matches = scan_text_patterns(text)
    
    presidio_matches = []
    if analyzer:
        try:
            results = analyzer.analyze(text=text, language=language)
            for r in results:
                presidio_matches.append({
                    "entity_type": r.entity_type,
                    "start": r.start,
                    "end": r.end,
                    "score": float(r.score),
                    "severity": "critical" if r.entity_type in ["CREDIT_CARD", "US_SSN", "IBAN_CODE"] else "medium",
                    "action": "block" if r.entity_type in ["CREDIT_CARD", "US_SSN"] else "mask"
                })
        except Exception:
            pass

    # Merge findings avoiding overlaps
    combined = list(regex_matches)
    for p in presidio_matches:
        # Check if overlaps with an existing match
        overlap = any(
            not (p["end"] <= c["start"] or p["start"] >= c["end"])
            for c in combined
        )
        if not overlap:
            combined.append(p)
            
    combined.sort(key=lambda x: x["start"])
    return combined
