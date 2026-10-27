# ZeroLeak AI — Testing Strategy & Test Execution

## 1. Test Architecture
ZeroLeak AI utilizes a multi-tiered automated testing framework to guarantee security invariants, detection accuracy, and API robustness:
- **Node.js Gateway Tests**: Jest + Supertest (`backend/tests/`)
- **Python Redactor Tests**: pytest (`file-processor/app/tests/`)

---

## 2. Test Execution Commands

### Running Node.js Backend Tests:
```bash
cd backend
npm test
```
The Jest test suite executes:
- `tests/detection.test.ts`: 7 pattern detection & overlap tests
- `tests/redaction.test.ts`: 5 fail-closed, placeholder, and tenant isolation tests
- `tests/api.test.ts`: 5 REST API integration & security tests
- **Total: 17 passing tests**

### Running Python Microservice Tests:
```bash
cd file-processor
pytest -v
```

---

## 3. Test Categories & Invariants Verified

| Test Category | Suite / File | Invariant Tested |
| :--- | :--- | :--- |
| **Credential Detection** | `tests/detection.test.ts` | Detects AWS access keys (`AKIA...`), Stripe keys, GitHub PATs, and OpenAI keys without false negatives. |
| **PII & Financial Validation** | `tests/detection.test.ts` | Validates credit cards using Luhn algorithm; flags US SSNs and email addresses. |
| **Overlap Resolution** | `tests/detection.test.ts` | Complex strings (e.g. database URLs containing credentials) resolve without corrupting offsets. |
| **Fail-Closed Safeguard** | `tests/redaction.test.ts` | Outgoing payloads with residual secrets are immediately aborted from external transmission. |
| **Placeholder Safety** | `tests/redaction.test.ts` | Permitted PII (email) is restored in output; API keys are strictly non-restorable. |
| **Cross-Tenant Isolation** | `tests/redaction.test.ts` | Users from organization A cannot access mapping handles created by organization B. |
| **REST API Security** | `tests/api.test.ts` | Endpoints (`/health`, `/inspect`, `/redact`, `/validate`, `/ai-chat`) enforce schema validation and sanitize error messages. |
