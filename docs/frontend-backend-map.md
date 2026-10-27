# ZeroLeak AI — Frontend to Backend Endpoint Mapping

This document provides a precise mapping between existing UI components, user interactions, backend REST API endpoints, Drizzle ORM models, and internal detection pipelines.

---

## 1. Overview Page (`/` and `/overview`)

| Component | User Action / Trigger | Backend Endpoint | HTTP Method | Data Transferred / Result |
| :--- | :--- | :--- | :--- | :--- |
| **MetricCard (x4)** | Page mount / auto-refresh | `/api/v1/zeroleak/metrics` | `GET` | Fetches `totalQueries`, `sensitiveItemsDetected`, `itemsRedacted`, `requestsBlocked`, `averageRiskScore`. Calculated from `zero_leak_audit_logs`. |
| **PrivacyActivityChart** | Time range toggle (`24h`, `7d`, `30d`) | `/api/v1/zeroleak/metrics/activity?range=24h` | `GET` | Aggregated query count and redacted token count grouped by time bucket. |
| **RiskDistributionChart** | Pre-filter distribution inspection | `/api/v1/zeroleak/metrics/risk-distribution` | `GET` | Query breakdown by risk level (`low`, `medium`, `high`, `critical`). |
| **DetectionCategoryCard** | Category breakdown view | `/api/v1/zeroleak/metrics/categories` | `GET` | Interceptions grouped by category (`api_keys`, `db_credentials`, `pii`, `ssh_keys`). |
| **RecentActivityTable** | Search query or filter pill click (`all`, `masked`, `blocked`, `clean`) | `/api/v1/zeroleak/audit-logs?filter=masked&search=...` | `GET` | Metadata-only logs from `zero_leak_audit_logs` (model, latency, action, detector, riskLevel). |
| **Export Scorecard Button** | Click *"Export Scorecard"* | `/api/v1/zeroleak/reports/scorecard` | `GET` | Generates and downloads signed JSON privacy audit compliance scorecard. |
| **Run Privacy Audit Button** | Click *"Run Privacy Audit"* | `/api/v1/zeroleak/scans/audit` | `POST` | Triggers immediate perimeter integrity check, updates metrics, returns toast status. |

---

## 2. Secure AI Chat Page (`/chat`)

| Component | User Action / Trigger | Backend Endpoint | HTTP Method | Data Transferred / Result |
| :--- | :--- | :--- | :--- | :--- |
| **ConversationSidebar** | Page mount / search conversations | `/api/v1/zeroleak/history` | `GET` | Returns user's chat sessions (`chat_sessions`) without raw messages. |
| **ConversationSidebar** | Click *"New Chat"* | `/api/v1/zeroleak/history` | `POST` | Creates new record in `chat_sessions` (`title: "New Session"`, `model: selectedModel`). |
| **ConversationSidebar** | Select conversation item | `/api/v1/zeroleak/history/:id` | `GET` | Retrieves sanitized messages for the session from `chat_messages`. |
| **ChatComposer** | Submit text prompt (`Enter` or click *"Send Sanitized"*) | `/api/v1/zeroleak/ai-chat` | `POST` | Payload: `{ model, prompt, sessionId }`. Pipeline: Detect -> Redact -> Ephemeral Map -> Gemini -> Response Scan -> Restore Permitted -> Audit Log. |
| **ChatComposer** | Attach image/document (`.png`, `.pdf`, `.docx`, etc.) | `/api/v1/zeroleak/files/scan` | `POST` | Multipart form upload. Validates mime/signature, passes to Python service for OCR and sensitive entity detection. |
| **ChatComposer** | Quick Test preset buttons (`Stripe`, `AWS`, `PII`, `Clean`) | Client-side preset loader -> `/api/v1/zeroleak/inspect` | `POST` | Sends sample payload to `/inspect` to preview detections before sending. |
| **SecureChatPanel** | Toggle *"Reversible Safe View"* / Masking | `/api/v1/zeroleak/redact` | `POST` | Shows client-side comparison between masked placeholders and safe surrogate representation. |
| **SecureChatPanel** | View remediation snippet / *"Copy Code"* | Local action | - | Copies AI-sanitized code proposal safely to clipboard. |
| **Header Model Dropdown** | Switch model (`Gemini 2.5 Flash`, `Claude 3.5 Sonnet`, etc.) | `/api/v1/zeroleak/settings` | `PATCH` | Updates `user_settings.defaultModel` in Neon PostgreSQL. |
| **Audit Log Modal** | Click *"Audit Log"* in header | `/api/v1/zeroleak/audit-logs` | `GET` | Fetches immutable metadata log entries from `zero_leak_audit_logs`. |

---

## 3. Policy Settings Page (`/policy`)

| Component | User Action / Trigger | Backend Endpoint | HTTP Method | Data Transferred / Result |
| :--- | :--- | :--- | :--- | :--- |
| **PolicyRuleTable** | Category selection | `/api/v1/zeroleak/policy` | `GET` | Returns built-in and organization-specific detection rules and default actions. |
| **PolicyRuleTable** | Toggle rule enabled/disabled switch | `/api/v1/zeroleak/policy/rules/:id` | `PATCH` | Updates `enabled` state of specific rule for current organization. |
| **PolicyRuleTable** | Change action override dropdown (`block`, `mask`, `warn`, `allow`) | `/api/v1/zeroleak/policy/rules/:id` | `PATCH` | Updates `actionOverride` for the selected rule. |
| **PolicyRuleTable** | Change default category action buttons | `/api/v1/zeroleak/policy/categories/:id` | `PATCH` | Updates category default action baseline. |
| **RegexSandboxModal** | Click *"Test Pattern"* | `/api/v1/zeroleak/validate` | `POST` | Payload: `{ regexPattern, testInput }`. Validates regex safely with bounded execution time and match offsets. |
| **Export Ruleset Button** | Click *"Export Ruleset (JSON)"* | `/api/v1/zeroleak/policy/export` | `GET` | Downloads current compiled policy schema JSON. |
| **Save Changes Button** | Click *"Save Changes"* | `/api/v1/zeroleak/policy/commit` | `POST` | Persists all pending policy modifications and flushes engine rule cache. |

---

## 4. File Processing & Document Redaction Workflow

```
[Frontend: ChatComposer.tsx]
      | (multipart/form-data)
      v
[Node.js Express Gateway: POST /api/v1/zeroleak/files/redact]
      |
      +---> Authenticate & Verify Tenant ID
      +---> Validate File Magic Bytes, Extension & Size (Max 15MB)
      +---> Generate Non-Colliding Storage ID & SHA-256 Hash
      |
      v (internal HTTP call with Bearer INTERNAL_SERVICE_TOKEN)
[Python FastAPI Microservice: POST /api/v1/files/redact]
      |
      +---> PDF (Text-based): PyMuPDF text extraction + Presidio/Regex -> add_redact_annot() -> apply_redactions()
      +---> PDF (Scanned): Tesseract OCR -> coordinate bounding box mapping -> PyMuPDF redaction
      +---> Images (PNG/JPG): Tesseract OCR + Presidio Image Redactor -> Pillow pixel masking
      +---> Word (.docx): python-docx paragraph and table cell replacement
      +---> Excel (.xlsx): openpyxl cell value scanning and string sanitization
      +---> PowerPoint (.pptx): python-pptx slide shape text redaction
      +---> Verification: Re-scan output to ensure 0 residual sensitive entities
      |
      v
[Node.js Express Gateway]
      |
      +---> Save sanitized file to private storage (/tmp/sanitized or object store)
      +---> Store audit metadata in zero_leak_audit_logs
      +---> Return download token and summary findings
      |
      v
[Frontend: Download / Attachment Chip in SecureChatPanel]
```
