import re
from typing import List, Dict, Any

PATTERNS = [
    {
        "type": "AWS_ACCESS_KEY",
        "regex": re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"),
        "severity": "critical",
        "action": "block"
    },
    {
        "type": "STRIPE_API_KEY",
        "regex": re.compile(r"\b(?:sk|rk)_(?:live|test)_[0-9a-zA-Z_]{16,}\b"),
        "severity": "critical",
        "action": "mask"
    },
    {
        "type": "GITHUB_TOKEN",
        "regex": re.compile(r"\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{22}_[A-Za-z0-9_]{59}\b"),
        "severity": "critical",
        "action": "block"
    },
    {
        "type": "DATABASE_URL",
        "regex": re.compile(r"\b(?:postgresql|postgres|mysql|mongodb(?:\+srv)?):\/\/[A-Za-z0-9_.-]+:[^@\s\"']+@[A-Za-z0-9_.-]+(?::[0-9]+)?\/[A-Za-z0-9_.-]*"),
        "severity": "critical",
        "action": "mask"
    },
    {
        "type": "PRIVATE_KEY",
        "regex": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
        "severity": "critical",
        "action": "block"
    },
    {
        "type": "EMAIL_ADDRESS",
        "regex": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
        "severity": "medium",
        "action": "mask"
    },
    {
        "type": "US_SSN",
        "regex": re.compile(r"\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b"),
        "severity": "critical",
        "action": "block"
    },
    {
        "type": "CREDIT_CARD",
        "regex": re.compile(r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b"),
        "severity": "critical",
        "action": "block"
    },
    {
        "type": "PHONE_NUMBER",
        "regex": re.compile(r"(?:\+?1[-.\s]?)?\(?[2-9]\d{2}\)?[-.\s]?[2-9]\d{2}[-.\s]?\d{4}\b"),
        "severity": "low",
        "action": "mask"
    }
]

def scan_text_patterns(text: str) -> List[Dict[str, Any]]:
    if not text:
        return []
    
    findings = []
    for p in PATTERNS:
        for match in p["regex"].finditer(text):
            matched_val = match.group(0)
            findings.append({
                "entity_type": p["type"],
                "start": match.start(),
                "end": match.end(),
                "matched": matched_val,
                "severity": p["severity"],
                "action": p["action"],
                "score": 0.98
            })
    return findings
