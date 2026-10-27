# ZeroLeak AI — Sensitive Information Detection & Redaction Platform

> Module 15 of VibeProofLens: Dual-mode AI Privacy Firewall, Reversible Redaction Proxy & Permanent Document Sanitization Engine.

---

## 1. Overview
ZeroLeak AI intercepts outbound Large Language Model interactions, code snippets, logs, and uploaded documents before they cross your network perimeter. It detects sensitive credentials, personal identifiable information (PII), and proprietary tokens using a hybrid multi-layer engine (Regex + Microsoft Presidio + Gitleaks), redacts them using ephemeral request-scoped surrogate placeholders, passes sanitized content to Google Gemini, inspects the response for echoed secrets, and selectively restores allowed placeholders for human readability.

---

## 2. Technology Stack
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend Gateway**: Node.js, Express.js, TypeScript, Zod, Helmet, CORS, Rate Limiting
- **Database & ORM**: **Neon PostgreSQL with Drizzle ORM**, Drizzle Kit, TypeScript migrations
- **AI Integration**: Official Google Gemini SDK (`@google/generative-ai`), model `gemini-2.5-flash`
- **File Redaction Microservice**: Python FastAPI, PyMuPDF, Pillow, pytesseract, python-docx, openpyxl, python-pptx

---

## 3. Directory Layout
```
Zero Leak/
├── backend/                  # Node.js + Express Gateway Service
│   ├── src/
│   │   ├── config/           # Environment validation (Zod)
│   │   ├── db/               # Drizzle ORM schema, Neon connection & seed
│   │   ├── middleware/       # Auth, Rate limiting, Error handler, Request ID
│   │   ├── routes/           # REST endpoints (/health, /inspect, /redact, /ai-chat, etc.)
│   │   ├── services/         # Detection, Redaction, Gemini, Placeholder, Audit
│   │   └── types/            # TypeScript domain types
│   ├── tests/                # Jest & Supertest test suite (17 passing tests)
│   ├── drizzle/              # Drizzle migrations
│   ├── .env.example          # Backend environment variables template
│   └── package.json
│
├── file-processor/           # Python FastAPI Document & Image Redaction Microservice
│   ├── app/
│   │   ├── detectors/        # Regex & Presidio analyzer
│   │   ├── redactors/        # PyMuPDF, Pillow, docx, xlsx, pptx redactors
│   │   ├── routes/           # /health, /api/v1/presidio, /api/v1/files/redact
│   │   └── main.py
│   ├── requirements.txt      # Python dependencies
│   ├── Dockerfile
│   └── .env.example
│
├── docs/                     # Comprehensive Architecture & Technical Docs
│   ├── architecture.md       # Topology and security boundaries
│   ├── api-reference.md      # REST API request/response specifications
│   ├── database-schema.md    # Drizzle schema, ERD, and tables
│   ├── frontend-backend-map.md # Mapping UI actions to endpoints
│   ├── implementation-plan.md # Phase tracking & checklist
│   ├── security-model.md     # Defensive invariants & fail-closed policy
│   ├── testing.md            # Automated testing strategy
│   └── troubleshooting.md   # Common errors and resolutions
│
├── src/                      # Next.js 16 Frontend UI
│   ├── app/                  # App Router pages (/overview, /chat, /policy)
│   ├── components/zeroleak/  # Preserved UI cards, charts, chat composer, modals
│   ├── context/              # ZeroLeakContext connected to live backend API
│   └── services/             # zeroleak-api.ts API client
│
├── docker-compose.yml        # Docker Compose configuration for multi-service stack
└── README.md
```

---

## 4. Getting Started Locally

### 1. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
# Accessible at http://localhost:3000
```

### 2. Backend Gateway Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure GEMINI_API_KEY and DATABASE_URL in .env if available
npm run build
npm start
# Server runs at http://localhost:4000
# Health check: http://localhost:4000/api/v1/zeroleak/health
```

### 3. Running Backend Tests
```bash
cd backend
npm test
# Executes 17 unit, integration, and security regression tests
```

### 4. Running with Docker Compose
```bash
docker-compose up --build
```
This launches the PostgreSQL database, the Python file-processing microservice, and the Node.js Express Gateway together.

---

## 5. Security Principles & Non-Negotiable Rules
- **Fail-Closed Guarantee**: Any detector outage, network timeout, or residual secret post-redaction halts external AI transmission immediately.
- **Zero Raw Secret Persistence**: Original prompt strings, secret tokens, and replacement dictionaries are NEVER stored in PostgreSQL or audit logs.
- **Ephemeral RAM Dictionary**: Placeholders mappings are held exclusively in server memory with an auto-expiring 300s TTL.
- **Permanent File Sanitization**: Redacted PDFs and images have underlying binary data permanently deleted and garbage-collected, preventing forensic recovery.
