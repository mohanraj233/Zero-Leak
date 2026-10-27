import io
from typing import Tuple, List, Dict, Any
from app.detectors.presidio_detector import analyze_text

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

def redact_pdf(file_bytes: bytes, filename: str) -> Tuple[bytes, List[Dict[str, Any]], int, int]:
    if not fitz:
        return file_bytes, [], 0, 0

    doc = fitz.open(stream=file_bytes, filetype="pdf")
    findings = []
    detected_count = 0
    redacted_count = 0

    for page_idx in range(len(doc)):
        page = doc[page_idx]
        page_text = page.get_text()
        
        if not page_text.strip():
            continue

        entities = analyze_text(page_text)
        
        for entity in entities:
            detected_count += 1
            findings.append({
                "entity_type": entity["entity_type"],
                "confidence": entity["score"],
                "severity": entity["severity"],
                "action": entity["action"],
                "occurrence_count": 1
            })

            matched_text = entity.get("matched")
            if matched_text:
                # Find all occurrences of the sensitive text on page
                rects = page.search_for(matched_text)
                for rect in rects:
                    page.add_redact_annot(rect, fill=(0, 0, 0))
                    redacted_count += 1

        # Permanently remove the underlying text and graphics
        page.apply_redactions()

    # Save sanitized PDF with aggressive garbage collection to ensure no trace remains
    out_bytes = io.BytesIO()
    doc.save(out_bytes, garbage=4, deflate=True)
    doc.close()

    return out_bytes.getvalue(), findings, detected_count, redacted_count
