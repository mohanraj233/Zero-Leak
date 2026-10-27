import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('ZeroLeak REST API Integration Tests', () => {
  it('GET /api/v1/zeroleak/health should return 200 with service metadata', async () => {
    const res = await request(app).get('/api/v1/zeroleak/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('ZeroLeak');
    expect(res.body.components.failClosedArmed).toBe(true);
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('POST /api/v1/zeroleak/inspect should detect sensitive credentials without leaking raw secrets', async () => {
    const res = await request(app)
      .post('/api/v1/zeroleak/inspect')
      .send({
        payload: 'const token = "sk_test_demo_51Mz00192847102938471029"; const email = "admin@example.com";',
      });

    expect(res.status).toBe(200);
    expect(res.body.hasSensitiveData).toBe(true);
    expect(res.body.entityCount).toBeGreaterThanOrEqual(2);
    expect(res.body.entities[0].type).toBeDefined();
    // Verify response does not leak raw secret value
    expect(JSON.stringify(res.body)).not.toContain('51Mz00192847102938471029');
  });

  it('POST /api/v1/zeroleak/redact should return sanitized payload and opaque mapping handle', async () => {
    const res = await request(app)
      .post('/api/v1/zeroleak/redact')
      .send({
        payload: 'Please reach out to support-dev@company.org with logs.',
      });

    expect(res.status).toBe(200);
    expect(res.body.sanitizedText).not.toContain('support-dev@company.org');
    expect(res.body.sanitizedText).toContain('<EMAIL_');
    expect(res.body.mappingHandle).toBeDefined();
    expect(res.body.verificationPassed).toBe(true);
  });

  it('POST /api/v1/zeroleak/validate should execute safe regex test in sandbox', async () => {
    const res = await request(app)
      .post('/api/v1/zeroleak/validate')
      .send({
        regexPattern: '[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+',
        testInput: 'User email is test.user@example.com for notification.',
      });

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.matched).toBe(true);
    expect(res.body.matchCount).toBe(1);
    expect(res.body.matches[0]).toBe('test.user@example.com');
  });

  it('POST /api/v1/zeroleak/ai-chat should fail-closed and block prompt containing critical AWS secret key', async () => {
    const res = await request(app)
      .post('/api/v1/zeroleak/ai-chat')
      .send({
        prompt: 'Deploy to AWS using credentials: AKIAIOSFODNN7EXAMPLE. Can you verify?',
      });

    expect(res.status).toBe(400);
    expect(res.body.blocked).toBe(true);
    expect(res.body.securityVerdict).toBe('blocked');
    expect(res.body.content).toContain('Fail-Closed Policy');
  });
});
