# ZeroLeak AI — REST API Reference (v1)

Base URL: `http://localhost:4000/api/v1/zeroleak`

All endpoints accept JSON payloads and return structured responses with an immutable tracking header: `X-Request-Id: <UUID>`.

---

### 1. Health & Dependency Status
`GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-27T15:58:00.000Z",
  "service": "ZeroLeak AI Gateway & DLP Engine",
  "version": "2.4.0",
  "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "components": {
    "database": {
      "connected": true,
      "provider": "Neon PostgreSQL (Drizzle ORM)"
    },
    "geminiProvider": {
      "configured": true,
      "model": "gemini-2.5-flash"
    },
    "presidioService": {
      "available": true
    },
    "gitleaksCli": {
      "installed": true
    },
    "failClosedArmed": true
  }
}
```

---

### 2. Inspect Payload
`POST /inspect`

Inspects candidate text or code for sensitive entities without necessarily calling an LLM provider.

**Request:**
```json
{
  "payload": "AWS key is AKIAIOSFODNN7EXAMPLE and email is dev@company.org",
  "sourceType": "prompt"
}
```

**Response:**
```json
{
  "requestId": "a021bb4c-...",
  "hasSensitiveData": true,
  "riskScore": 88,
  "riskLevel": "critical",
  "recommendedAction": "block",
  "blocked": true,
  "blockedReason": "Critical credential detected: AWS_ACCESS_KEY (ZeroLeak AWS Pattern)",
  "entityCount": 2,
  "entities": [
    {
      "id": "entity-1-179302...",
      "type": "AWS_ACCESS_KEY",
      "category": "secrets",
      "placeholder": "<AWS_ACCESS_KEY_1>",
      "originalMasked": "AKI••••••••MPLE",
      "start": 11,
      "end": 31,
      "severity": "critical",
      "detector": "ZeroLeak AWS Pattern",
      "action": "block",
      "confidence": 0.98
    },
    {
      "id": "entity-2-179302...",
      "type": "EMAIL_ADDRESS",
      "category": "pii",
      "placeholder": "<EMAIL_2>",
      "originalMasked": "de••••••rg",
      "start": 45,
      "end": 60,
      "severity": "medium",
      "detector": "ZeroLeak PII Email Pattern",
      "action": "mask",
      "confidence": 0.98
    }
  ],
  "latencyMs": 4
}
```

---

### 3. Redact Payload
`POST /redact`

Replaces detected sensitive tokens with opaque placeholders and establishes an ephemeral in-memory mapping.

**Request:**
```json
{
  "payload": "Please ping security-team@corp.io for auth setup.",
  "strategy": "placeholder"
}
```

**Response:**
```json
{
  "requestId": "b342cc8e-...",
  "sanitizedText": "Please ping <EMAIL_1> for auth setup.",
  "mappingHandle": "zh-92019488-2019-2847-1029-384710293847",
  "entityCount": 1,
  "hasSensitiveData": true,
  "blocked": false,
  "riskScore": 38,
  "riskLevel": "medium",
  "action": "mask",
  "verificationPassed": true,
  "latencyMs": 5
}
```

---

### 4. Validate Pattern Sandbox
`POST /validate`

Executes regex match tests in a safe, CPU-bounded sandbox without network access.

**Request:**
```json
{
  "regexPattern": "(?:sk|rk)_(?:live|test)_[0-9a-zA-Z_]{16,}",
  "testInput": "const key = 'sk_test_demo_51Mz00192847102938471029';"
}
```

**Response:**
```json
{
  "valid": true,
  "matched": true,
  "matches": ["sk_test_demo_51Mz00192847102938471029"],
  "matchCount": 1,
  "executionTimeMs": 0.4
}
```

---

### 5. Secure AI Chat Gateway
`POST /ai-chat`

Sanitizes prompt, verifies fail-closed invariants, forwards sanitized content to Google Gemini, inspects response, and restores permitted PII.

**Request:**
```json
{
  "model": "gemini-2.5-flash",
  "prompt": "How do I configure OAuth in Next.js? Contact me at dev@example.com",
  "sessionId": "conv-1"
}
```

**Response (Success):**
```json
{
  "content": "To configure OAuth in Next.js, use Auth.js / NextAuth with environment-based provider secrets. We have noted your contact dev@example.com.",
  "remediationSnippet": {
    "title": "Proposed Remediation Snippet",
    "language": "typescript",
    "code": "import NextAuth from 'next-auth';\nexport const { handlers, auth } = NextAuth({ providers: [] });"
  },
  "securityVerdict": "safe",
  "blocked": false,
  "detectedCount": 1,
  "redactedCount": 1,
  "entities": [...],
  "securityNote": "Payload sanitized through ZeroLeak Fail-Closed Gateway.",
  "latencyMs": 1420,
  "requestId": "f88201a4-..."
}
```

**Response (Blocked - Fail-Closed Triggered):**
```json
{
  "content": "[ZeroLeak Gateway: Blocked per Fail-Closed Policy]\n\nCritical secret credentials detected in prompt stream (AWS_ACCESS_KEY). External LLM transmission aborted.",
  "securityVerdict": "blocked",
  "blocked": true,
  "detectedCount": 1,
  "redactedCount": 0,
  "entities": [...],
  "securityNote": "Zero-exposure guarantee: No raw credentials were transmitted over the network.",
  "requestId": "f88201a4-..."
}
```

---

### 6. File Scan & Permanent Redaction
`POST /files/redact` (Multipart form-data)

Uploads `.pdf`, `.png`, `.jpg`, `.docx`, `.xlsx`, or `.pptx` up to 15MB. Permanently redacts sensitive content in the binary file.

**Response:**
```json
{
  "requestId": "e12a4b9c-...",
  "fileId": "file-10293847",
  "originalFilename": "invoice_sample.pdf",
  "sanitizedFilename": "sanitized-invoice_sample.pdf",
  "mimeType": "application/pdf",
  "sizeBytes": 204850,
  "detectedCount": 4,
  "redactedCount": 4,
  "status": "redacted",
  "downloadToken": "file-10293847",
  "downloadUrl": "/api/v1/zeroleak/files/file-10293847/download",
  "processingTimeMs": 312,
  "verificationPassed": true
}
```

---

### 7. Download Sanitized File
`GET /files/:id/download`

Streams the permanently sanitized file binary. Enforces organization tenant boundaries.
