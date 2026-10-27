# ZeroLeak AI — Troubleshooting & Operations Guide

## 1. Common Issues & Solutions

### 1. "Database running in standby mode" (ECONNREFUSED / Connection refused)
- **Cause**: Local PostgreSQL or remote Neon connection string is unreachable or not configured in `backend/.env`.
- **Solution**:
  - For local development: ZeroLeak Gateway operates gracefully in standby mode using client-side and in-memory evaluation.
  - To connect Neon PostgreSQL: Open [Neon Console](https://console.neon.tech), create a database, copy the connection string, and set `DATABASE_URL` in `backend/.env`:
    ```env
    DATABASE_URL=postgresql://neondb_owner:password@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
    ```
  - Run database migrations: `npm run db:migrate` in `backend/`.

### 2. "GEMINI_API_KEY is not configured"
- **Cause**: The backend `.env` has an empty `GEMINI_API_KEY`.
- **Solution**:
  - In accordance with the Fail-Closed security policy, ZeroLeak halts external egress and outputs a clear security notice when remote credentials are missing.
  - Obtain an API key from [Google AI Studio](https://aistudio.google.com/).
  - Set `GEMINI_API_KEY=AIzaSy...` in `backend/.env`.
  - Restart the backend server.

### 3. "Python Microservice unreachable" (Presidio / File Redaction)
- **Cause**: The Python FastAPI service on port 8000 is not running.
- **Solution**:
  - The Node.js Express Gateway automatically falls back to local regex sanitization without crashing.
  - To start the Python microservice:
    ```bash
    cd file-processor
    python -m venv venv
    venv\Scripts\activate  # Windows
    pip install -r requirements.txt
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    ```

### 4. Gitleaks CLI Missing Warning
- **Cause**: `gitleaks` is not installed on the system PATH.
- **Solution**:
  - ZeroLeak continues detecting secrets via the built-in JavaScript RegExp engine without interruption.
  - To install Gitleaks: Download the binary from [Gitleaks GitHub Releases](https://github.com/gitleaks/gitleaks/releases) or run `choco install gitleaks` / `brew install gitleaks`.
