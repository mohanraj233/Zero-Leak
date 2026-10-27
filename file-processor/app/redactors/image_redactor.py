import io
from PIL import Image, ImageDraw
from typing import Tuple, List, Dict, Any
from app.detectors.presidio_detector import analyze_text

# Optional pytesseract
try:
    import pytesseract
except ImportError:
    pytesseract = None

def redact_image(file_bytes: bytes, filename: str) -> Tuple[bytes, List[Dict[str, Any]], int, int]:
    image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
    findings = []
    detected_count = 0
    redacted_count = 0

    extracted_text = ""
    boxes_data = []

    # Run OCR if pytesseract is available
    if pytesseract:
        try:
            # Extract OCR text with bounding boxes
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            n_boxes = len(data["text"])
            
            draw = ImageDraw.Draw(image)
            words = []
            
            for i in range(n_boxes):
                text_word = data["text"][i].strip()
                if not text_word:
                    continue
                words.append({
                    "word": text_word,
                    "x": data["left"][i],
                    "y": data["top"][i],
                    "w": data["width"][i],
                    "h": data["height"][i]
                })

            full_line = " ".join([w["word"] for w in words])
            detected = analyze_text(full_line)
            
            for d in detected:
                detected_count += 1
                findings.append({
                    "entity_type": d["entity_type"],
                    "confidence": d["score"],
                    "severity": d["severity"],
                    "action": d["action"],
                    "occurrence_count": 1
                })

                # Redact matching words
                for w in words:
                    if d.get("matched") and w["word"] in d["matched"]:
                        draw.rectangle(
                            [w["x"] - 2, w["y"] - 2, w["x"] + w["w"] + 2, w["y"] + w["h"] + 2],
                            fill="black"
                        )
                        redacted_count += 1
        except Exception:
            pass

    out_bytes = io.BytesIO()
    image.save(out_bytes, format="PNG")
    return out_bytes.getvalue(), findings, detected_count, redacted_count
