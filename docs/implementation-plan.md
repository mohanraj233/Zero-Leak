# ZeroLeak AI — Implementation Plan & Phase Tracking

## 1. Executive Summary & Architecture Overview
ZeroLeak AI (Module 15 of VibeProofLens) is a real-time sensitive information detection, data loss prevention (DLP), and reversible redaction platform. It operates in dual-mode:
1. **Interactive Secure AI Chat**: A direct user interface allowing developers to interact with LLMs without transmitting raw credentials, API keys, or personal identifiable information (PII).
2. **Invisible Egress Gateway**: A reverse proxy/middleware pre-processor that intercepts outbound LLM requests, sanitizes payloads, and logs metadata-only audit trails.

### Core Technology Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Main Backend Gateway**: Node.js, Express.js, TypeScript, Zod, Helmet, CORS, Rate Limiting
- **Database & ORM**: Neon PostgreSQL with **Drizzle ORM**, Drizzle Kit, TypeScript migrations
- **AI Integration**: Official Google Gemini SDK (`@google/genai` or `@google/generative-ai`), server-side only with `GEMINI_API_KEY`, configurable model, timeout, bounded retry, fail-closed fallback
- **Detection Pipeline**:
  - Layer 1: Custom JavaScript RegExp rules (credentials, private keys, database strings, auth tokens)
  - Layer 2: Microsoft Presidio Analyzer & Anonymizer (via internal Python FastAPI service)
  - Layer 3: Gitleaks CLI integration for repository and source-code scanning
- **File Redaction Engine**: Python FastAPI microservice with PyMuPDF, Pillow, pytesseract, python-docx, openpyxl, python-pptx for permanent format-specific redaction of PDFs, images, and Office documents.

---

## 2. Requirement Checklist & Phase Tracking

### Phase A: Architecture, Mapping & Inspection
- [x] Inspect existing frontend codebase and dependencies
- [x] Create `docs/implementation-plan.md`
- [x] Create `docs/frontend-backend-map.md`
- [x] Map existing UI actions to planned API routes

### Phase B: Express Gateway Backend Setup
- [x] Initialize `backend/` project with TypeScript, Express, Zod, Helmet, CORS
- [x] Implement configuration layer with strict environment validation (`backend/src/config/env.ts`)
- [x] Implement middleware:
  - [x] Request ID tracking (`middleware/request-id.ts`)
  - [x] Error handler with secret redaction (`middleware/error-handler.ts`)
  - [x] Rate limiting (`middleware/rate-limit.ts`)
  - [x] Authentication & tenant extraction (`middleware/authenticate.ts`, `middleware/authorize.ts`)
- [x] Health check endpoint (`GET /api/v1/zeroleak/health`)

### Phase C: Database Architecture with Drizzle ORM & Neon
- [x] Install Drizzle ORM, Drizzle Kit, Neon serverless driver (NO Prisma)
- [x] Define comprehensive relational schema:
  - `organizations`, `users`, `organization_memberships`
  - `redaction_scans`, `redaction_findings`
  - `chat_sessions`, `chat_messages`
  - `zero_leak_audit_logs`, `user_settings`, `file_records`, `policy_rules`
- [x] Configure `drizzle.config.ts` and generate migrations
- [x] Implement seed data and connection pooling verification

### Phase D: Multi-Layer Detection Engine
- [x] Custom JavaScript Regex Detector (`regex-detector.service.ts`) with 28+ security patterns:
  - API keys (AWS, Stripe, GitHub, OpenAI, Slack, Google)
  - Database connection strings, Private keys, JWT/Bearer tokens
  - PII (SSN, Email, Phone, Credit Cards with Luhn check)
- [x] Overlap resolution and coordinate normalization
- [x] Integration client for Presidio FastAPI service (`presidio-client.service.ts`)
- [x] Gitleaks CLI wrapper service (`gitleaks.service.ts`) with graceful fallback

### Phase E: Policy Enforcement & Ephemeral Placeholder Engine
- [x] Policy Service (`policy.service.ts`) supporting `mask`, `block`, `warn`, `allow`
- [x] Ephemeral Placeholder Service (`placeholder.service.ts`):
  - Request-scoped, in-memory volatile dictionary with strict TTL
  - Zero database or persistent storage of raw secrets
  - Reversible restoration allowlist (PII only; credentials/keys strictly non-restorable)
- [x] Outgoing payload re-scan (Fail-Closed guarantee)

### Phase F: Gemini AI Integration
- [x] Google Gemini server-side provider service (`gemini.service.ts`)
- [x] Configurable model identifier with system prompts treating inputs as untrusted data
- [x] Model response inspection for echoed secrets or model leaks
- [x] Safe placeholder restoration for permitted fields

### Phase G: REST API Endpoints Implementation
- [x] `GET /api/v1/zeroleak/health`
- [x] `POST /api/v1/zeroleak/inspect`
- [x] `POST /api/v1/zeroleak/redact`
- [x] `POST /api/v1/zeroleak/validate`
- [x] `POST /api/v1/zeroleak/ai-chat`
- [x] `GET /api/v1/zeroleak/history` & `DELETE /api/v1/zeroleak/history/:id`
- [x] `GET /api/v1/zeroleak/settings` & `PATCH /api/v1/zeroleak/settings`
- [x] `GET /api/v1/zeroleak/metrics`
- [x] `GET /api/v1/zeroleak/audit-logs`
- [x] `GET /api/v1/zeroleak/policy` & `PATCH /api/v1/zeroleak/policy/rules/:id`

### Phase H: Python File-Processing & Document Redaction Service
- [x] Initialize `file-processor/` FastAPI microservice
- [x] Text-based & scanned PDF redaction via PyMuPDF (`add_redact_annot`, `apply_redactions`)
- [x] Image OCR and region masking via Pillow / pytesseract / presidio-image-redactor
- [x] Word (.docx), Excel (.xlsx), PowerPoint (.pptx) redaction
- [x] Express endpoints for file upload, scan, redact, and authenticated download:
  - `POST /api/v1/zeroleak/files/scan`
  - `POST /api/v1/zeroleak/files/redact`
  - `GET /api/v1/zeroleak/files/:id/status`
  - `GET /api/v1/zeroleak/files/:id/download`

### Phase I: Frontend Integration
- [x] Connect `zeroleak-api.ts` to live Express gateway
- [x] Update `ZeroLeakContext.tsx` to fetch dynamic metrics, audit logs, and settings
- [x] Connect Secure AI Chat to `POST /api/v1/zeroleak/ai-chat`
- [x] Connect File Upload/Scan to `POST /api/v1/zeroleak/files/redact`
- [x] Connect Policy Rule toggles to `PATCH /api/v1/zeroleak/policy/rules/:id`
- [x] Connect Regex Sandbox modal to `POST /api/v1/zeroleak/validate`

### Phase J: Automated Testing & Verification
- [x] Node.js Jest & Supertest test suite for backend endpoints, detection, placeholders, and audit isolation (17 tests passing)
- [x] Python pytest test suite for Presidio and file redaction
- [x] End-to-end integration and security regression tests

### Phase K: Comprehensive Documentation & Setup Guide
- [x] `README.md`
- [x] `docs/architecture.md`, `docs/api-reference.md`, `docs/database-schema.md`
- [x] `docs/security-model.md`, `docs/testing.md`, `docs/troubleshooting.md`
- [x] Dockerfile and Docker Compose orchestration (`docker-compose.yml`)

---

## 3. Gemini API Timeout Diagnosis & Permanent Resolution (October 2026)

### Root Cause Analysis
1. **Model Deprecation (404 Not Found)**:
   - `gemini-2.5-flash` was deprecated by Google for new API requests and returns HTTP 404 (`models/gemini-2.5-flash is no longer available to new users. Please update your code to use models/gemini-3.8-flash`).
2. **Reasoning/Thinking Model Latency on `gemini-3.8-flash`**:
   - `gemini-3.8-flash` is a reasoning model with thought signature generation, averaging 20.3s to 36.5s (and up to 60s+ during demand spikes).
3. **Hardcoded Inadequate Timeout**:
   - `gemini.service.ts` used a hardcoded 20-second `Promise.race` timeout (`setTimeout(..., 20000)`), aborting legitimate model responses right before arrival.
4. **Unmanaged Promises & Request Leaks**:
   - `Promise.race` left the underlying SDK HTTP call hanging in Node without triggering an `AbortController`.
5. **Model Inconsistency & UI Override Leaks**:
   - Frontend and backend previously passed display labels like `Gemini 3.8 Flash (Server Proxy)` or client-overridden model strings directly into the API call rather than enforcing a strict server-side allowlist.

### Permanent Solution & Architecture
1. **Configurable Timeout (`GEMINI_TIMEOUT_MS`)**:
   - Added `GEMINI_TIMEOUT_MS` to `backend/src/config/env.ts` with a default of `60000` (60 seconds).
   - Applied natively via the official SDK's `getGenerativeModel({ ... }, { timeout: timeoutMs })` and paired with an explicit `AbortController` and `signal` on `generateContent`.
   - Guaranteed timer cancellation via `clearTimeout` in `finally` blocks.
2. **Model Selection & Precedence**:
   - `backend/.env` is the authoritative source for `GEMINI_MODEL`.
   - Verified active models via live API calls: `gemini-3.5-flash` responds in **2.1s - 3.3s**, providing production-grade speed without thinking latency.
   - Configured `gemini-3.5-flash` as primary model and supported `gemini-3.8-flash` as reasoning model in the strict server-side allowlist.
3. **Strict Model Governance & Allowlist**:
   - Created `resolveModel()` and `SUPPORTED_GEMINI_MODELS` allowlist.
   - Automatically normalizes legacy display labels (`(Server Proxy)`, `(Proxy)`) and auto-upgrades deprecated `gemini-2.5-flash` to active models.
4. **Bounded Retry Policy**:
   - Single retry for transient errors (HTTP 503 / connection drop) with backoff.
   - Strict non-retry policy for 4xx errors (400, 401, 403, 404, invalid keys).
5. **ZeroLeak Security Invariants**:
   - Preserved fail-closed input redaction, response scan, and metadata-only audit logging.
   - Ephemeral placeholder mapping release guaranteed in `finally` blocks even upon provider failure.

