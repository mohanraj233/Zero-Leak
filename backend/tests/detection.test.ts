import { regexDetector } from '../src/services/regex-detector.service.js';

describe('ZeroLeak Detection Engine Tests', () => {
  it('should detect AWS Access Key and categorize as critical secret', () => {
    const input = 'My deployment key is AKIAIOSFODNN7EXAMPLE for S3';
    const entities = regexDetector.detect(input);

    expect(entities.length).toBeGreaterThan(0);
    const aws = entities.find((e) => e.type === 'AWS_ACCESS_KEY');
    expect(aws).toBeDefined();
    expect(aws?.severity).toBe('critical');
    expect(aws?.action).toBe('block');
  });

  it('should detect Stripe API test key', () => {
    const input = 'const stripeKey = "sk_test_demo_51Mz00192847102938471029";';
    const entities = regexDetector.detect(input);

    expect(entities.length).toBeGreaterThan(0);
    const stripe = entities.find((e) => e.type === 'STRIPE_API_KEY');
    expect(stripe).toBeDefined();
    expect(stripe?.severity).toBe('critical');
  });

  it('should detect Email addresses in text', () => {
    const input = 'Please contact security-team@example.com for access.';
    const entities = regexDetector.detect(input);

    const email = entities.find((e) => e.type === 'EMAIL_ADDRESS');
    expect(email).toBeDefined();
    expect(email?.category).toBe('pii');
    expect(email?.action).toBe('mask');
  });

  it('should detect US SSN and mark as critical block', () => {
    const input = 'Customer taxpayer record SSN: 123-45-6789.';
    const entities = regexDetector.detect(input);

    const ssn = entities.find((e) => e.type === 'US_SSN');
    expect(ssn).toBeDefined();
    expect(ssn?.severity).toBe('critical');
    expect(ssn?.action).toBe('block');
  });

  it('should validate credit cards using Luhn algorithm and reject invalid numbers', () => {
    // 4111111111111111 is a standard Luhn-valid test card
    const validCard = 'Payment test: 4111111111111111';
    const validEntities = regexDetector.detect(validCard);
    expect(validEntities.some((e) => e.type === 'CREDIT_CARD')).toBe(true);

    // 4111111111111112 fails Luhn checksum
    const invalidCard = 'Payment test: 4111111111111112';
    const invalidEntities = regexDetector.detect(invalidCard);
    expect(invalidEntities.some((e) => e.type === 'CREDIT_CARD')).toBe(false);
  });

  it('should resolve overlapping matches without duplicating or corrupting spans', () => {
    const input = 'postgresql://admin:password123@db.example.com:5432/main';
    const entities = regexDetector.detect(input);

    // Should resolve as DATABASE_URL rather than conflicting with nested patterns
    expect(entities.length).toBe(1);
    expect(entities[0].type).toBe('DATABASE_URL');
  });

  it('should return empty list for clean benign developer code', () => {
    const input = 'export interface UserSession { id: string; role: "admin" | "user"; }';
    const entities = regexDetector.detect(input);
    expect(entities.length).toBe(0);
  });
});
