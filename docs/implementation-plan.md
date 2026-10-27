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
