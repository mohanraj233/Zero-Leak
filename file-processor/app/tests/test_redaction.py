import pytest
from app.detectors.regex_detector import scan_text_patterns
from app.detectors.presidio_detector import analyze_text
from app.redactors.image_redactor import redact_image
from app.redactors.docx_redactor import redact_docx
from app.redactors.xlsx_redactor import redact_xlsx

def test_regex_scan_patterns():
    sample = "My test key is AKIAIOSFODNN7EXAMPLE and email is dev@zeroleak.org"
    findings = scan_text_patterns(sample)
    types = [f["entity_type"] for f in findings]
    
    assert "AWS_ACCESS_KEY" in types
    assert "EMAIL_ADDRESS" in types

def test_presidio_detector_merges():
    sample = "Contact admin@example.com for Stripe sk_test_demo_51Mz00192847102938471029"
    results = analyze_text(sample)
    types = [r["entity_type"] for r in results]
    
    assert any("STRIPE" in t for t in types)
    assert any("EMAIL" in t for t in types)

def test_image_redactor_produces_valid_png():
    from PIL import Image
    import io
    
    img = Image.new("RGB", (200, 100), color="white")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    
    out_bytes, findings, detected, redacted = redact_image(buf.getvalue(), "test.png")
    assert len(out_bytes) > 0
    
    # Verify valid image output
    out_img = Image.open(io.BytesIO(out_bytes))
    assert out_img.size == (200, 100)
