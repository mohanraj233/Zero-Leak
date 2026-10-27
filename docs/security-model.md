# ZeroLeak AI — Security Model & Data Protection Architecture

## 1. Threat Model & Asset Protection
ZeroLeak AI addresses the risk of accidental and intentional exfiltration of sensitive organizational assets during developer interaction with public/hosted Large Language Models (LLMs).

### High-Value Protected Assets:
1. **Cloud & Infrastructure Credentials**: AWS root/IAM access keys, GCP API keys, Azure tokens.
2. **Payment & Banking Identifiers**: Stripe live/test secret keys, Credit card numbers with Luhn checksums, IBANs, UPI VPAs.
3. **Authentication Secrets**: Private RSA/OpenSSH/PGP keys, Database connection URLs containing passwords, JWTs, Bearer tokens.
4. **Personal Identifiable Information (PII)**: US Social Security Numbers, Passports, National IDs, Personal Emails, Phone numbers.

---

## 2. Security Controls & Defensive Invariants

### 1. Fail-Closed Default
- If any internal detector (Regex, Presidio, Gitleaks) encounters an unhandled exception or network timeout, the request does NOT proceed to the external provider.
- If the post-redaction re-scan detects residual critical credentials, the egress stream is instantly aborted and marked `BLOCKED`.

### 2. Ephemeral In-Memory Mapping (Zero Persistent Plaintext)
- When placeholders (e.g. `<STRIPE_SECRET_1>`, `<EMAIL_1>`) are injected, their raw-to-surrogate mappings are stored exclusively in volatile Node.js server RAM.
- **TTL**: Mappings automatically expire and are purged after 300 seconds (configurable via `MAPPING_TTL_SECONDS`).
- **Isolation**: Each mapping context is scoped strictly to `(userId, organizationId)`. Cross-user or cross-tenant access to another session's mapping handle is structurally blocked and logged as an authorization violation.

### 3. Asymmetric Placeholder Restoration
- **Allowed Restoration**: Only non-secret PII (names, emails, phone numbers, locations) may be restored in the model's textual responses for human readability.
- **Strictly Non-Restorable**: Passwords, API keys, private keys, database connection strings, and access tokens are NEVER restored into model responses or suggested code diffs. They remain permanently masked as `<SECRET_N>` in the final user output.

### 4. Response Inspection Pipeline
- Before returning any text to the browser, the ZeroLeak Gateway scans model outputs for echoed or newly synthesized credentials.
- If a model hallucinates or echoes a critical credential, the response is replaced with a safe security refusal notice and marked `BLOCKED`.

### 5. Multi-Tenant Organization Isolation
- Every database query and file download is constrained by authenticated `organizationId` and `userId`.
- Direct object references (IDOR) on chat histories or file downloads are blocked by tenant ownership checks.

### 6. Sanitized Audit Logging
- Audit logs in `zero_leak_audit_logs` record metadata only: request timestamps, latencies, provider IDs, model identifiers, detection counts, and outcome verdicts (`Passed`, `Sanitized`, `Blocked`).
- Raw prompts, sanitized text, and replacement mappings are NEVER written to audit records.
