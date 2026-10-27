# ZeroLeak AI — System Architecture & Topology

## 1. System Topology Overview
ZeroLeak AI is designed according to the **Method B (Hybrid Custom Gateway & Secure Chat UI)** architecture specified in Module 15 of VibeProofLens. It serves as an egress firewall and privacy proxy separating untrusted client inputs and developer workflows from remote Large Language Model providers (Google Gemini) and cloud infrastructure.

```
+-------------------------------------------------------------------------+
|                         VibeProofLens Client Layer                      |
|                                                                         |
|   +-----------------------------------------------------------------+   |
|   |            Next.js 16 (App Router) + React 19 UI                |   |
|   |  - ZeroLeak Overview Dashboard  (/)                             |   |
|   |  - Secure AI Chat UI            (/chat)                         |   |
|   |  - Policy Settings & Governance (/policy)                       |   |
|   +-----------------------------------------------------------------+   |
+------------------------------------+------------------------------------+
                                     | HTTPS / REST
                                     v
+-------------------------------------------------------------------------+
|                  ZeroLeak Node.js Express Gateway (Port 4000)           |
|                                                                         |
|  +--------------------+   +-------------------+   +------------------+  |
|  | Request ID & Rate  |   | JWT & Org-Tenant  |   | Secret-Redacting |  |
|  | Limiting (Helmet)  |   | Authentication    |   | Error Handling   |  |
|  +--------------------+   +-------------------+   +------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                     Multi-Tier Detection Pipeline                 |  |
|  |  [Layer 1: JavaScript RegExp (28+ Patterns)]                      |  |
|  |  [Layer 2: Microsoft Presidio Client (Internal HTTP)]             |  |
|  |  [Layer 3: Gitleaks CLI Scanner (Source Code Repos)]              |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                     Policy & Redaction Engine                     |  |
|  |  - Actions: Mask, Hard Block, Warn, Allow                         |  |
|  |  - Ephemeral Request-Scoped Mapping (In-Memory RAM dictionary)    |  |
|  |  - Fail-Closed Egress Safeguard (Post-Redaction Re-Scan)         |  |
|  +-------------------------------------------------------------------+  |
|                                                                         |
|  +-------------------------------------------------------------------+  |
|  |                     Response Inspection Engine                    |  |
|  |  - Scans model output for echoed or newly exposed secrets         |  |
|  |  - Restores ONLY explicitly permitted placeholders (PII)          |  |
|  |  - Critical credentials / API keys are STRICTLY non-restorable    |  |
|  +-------------------------------------------------------------------+  |
+-------------------+--------------------+-------------------+------------+
                    |                    |                   |
                    | Internal HTTP      | Pooled Connection | HTTPS (Sanitized)
                    v                    v                   v
+--------------------------+   +-------------------+   +------------------+
| Python FastAPI Service   |   | Neon PostgreSQL   |   | Official Google  |
| (Port 8000)              |   | (Drizzle ORM)     |   | Gemini API SDK   |
|                          |   |                   |   |                  |
| - PyMuPDF PDF Redactor   |   | - Organizations   |   | - Server-side    |
| - Presidio Analyzer      |   | - Users           |   |   only key       |
| - Pillow Image Redactor  |   | - RedactionScans  |   | - Sanitized      |
| - Tesseract OCR Engine   |   | - AuditLogs       |   |   prompts only   |
| - DOCX, XLSX, PPTX       |   | - FileRecords     |   | - Model:         |
|   Document Redactors     |   | - PolicyRules     |   |   gemini-2.5-    |
|                          |   |                   |   |   flash          |
| (Private Microservice)   |   | (Metadata Only!)  |   |                  |
+--------------------------+   +-------------------+   +------------------+
```

---

## 2. Security Boundaries & Invariants
1. **Zero Browser-to-Model Egress**: The client browser NEVER possesses the `GEMINI_API_KEY` and NEVER dispatches requests directly to external AI providers.
2. **Fail-Closed Default**: If an internal detector errors, the connection times out, or a residual critical credential is detected during the post-redaction re-scan, all external egress is aborted immediately.
3. **Volatile Ephemeral Mapping**: Reversible placeholder context (`<EMAIL_1>`, `<PHONE_1>`) is held exclusively in memory on the server with a short TTL (300 seconds). It is NEVER written to PostgreSQL, disk storage, audit logs, or browser local storage.
4. **Permanent File Redaction**: PDF redaction permanently erases underlying binary character streams and images using PyMuPDF `apply_redactions()` and `garbage=4`. It does not simply paint an overlay rectangle.
