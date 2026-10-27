import { redactionService } from '../src/services/redaction.service.js';
import { placeholderService } from '../src/services/placeholder.service.js';

describe('ZeroLeak Redaction & Placeholder Safety Tests', () => {
  const userId = 'test-user-123';
  const orgId = 'test-org-456';

  it('should replace sensitive email with a typed placeholder', async () => {
    const raw = 'Send notifications to sec-lead@company.org regarding server incident.';
    const result = await redactionService.sanitizePayload(raw, userId, orgId);

    expect(result.blocked).toBe(false);
    expect(result.sanitizedText).not.toContain('sec-lead@company.org');
    expect(result.sanitizedText).toContain('<EMAIL_');
    expect(result.redactedCount).toBe(1);
    expect(result.mappingHandle).toBeTruthy();
  });

  it('should block critical AWS key under Fail-Closed policy', async () => {
    const raw = 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE';
    const result = await redactionService.sanitizePayload(raw, userId, orgId);

    expect(result.blocked).toBe(true);
    expect(result.blockedReason).toContain('AWS_ACCESS_KEY');
    expect(result.action).toBe('block');
  });

  it('should selectively restore allowed PII in model output stream', () => {
    const rawPrompt = 'Contact dev@example.com';
    const entities = [
      {
        id: 'e1',
        type: 'EMAIL_ADDRESS',
        category: 'pii' as const,
        placeholder: '<EMAIL_1>',
        originalMasked: 'de••••••om',
        start: 8,
        end: 23,
        severity: 'medium' as const,
        detector: 'Regex',
        action: 'mask' as const,
        confidence: 0.98,
      },
    ];

    const mapping = placeholderService.createMapping(rawPrompt, entities, userId, orgId);
    expect(mapping.sanitizedText).toBe('Contact <EMAIL_1>');

    // Simulate AI response echoing the placeholder
    const aiResponse = 'I have acknowledged your request regarding <EMAIL_1>.';
    const restored = placeholderService.restorePermittedPlaceholders(
      aiResponse,
      mapping.mappingHandle,
      userId,
      orgId
    );

    expect(restored.restoredText).toBe('I have acknowledged your request regarding dev@example.com.');
    expect(restored.restoredCount).toBe(1);
  });

  it('should NEVER restore critical credentials into model response', () => {
    const rawPrompt = 'API_KEY=sk_test_demo_51Mz00192847102938471029';
    const entities = [
      {
        id: 'e2',
        type: 'STRIPE_API_KEY',
        category: 'secrets' as const,
        placeholder: '<STRIPE_SECRET_1>',
        originalMasked: 'sk_••••••29',
        start: 8,
        end: 45,
        severity: 'critical' as const,
        detector: 'Regex',
        action: 'mask' as const,
        confidence: 0.98,
      },
    ];

    const mapping = placeholderService.createMapping(rawPrompt, entities, userId, orgId);

    // Simulate AI attempting to output code with the secret placeholder
    const aiCodeOutput = 'Use this configuration: stripe = Stripe("<STRIPE_SECRET_1>");';
    const restored = placeholderService.restorePermittedPlaceholders(
      aiCodeOutput,
      mapping.mappingHandle,
      userId,
      orgId
    );

    // Must remain masked as <STRIPE_SECRET_1>!
    expect(restored.restoredText).toContain('<STRIPE_SECRET_1>');
    expect(restored.restoredText).not.toContain('sk_test_demo_51Mz00192847102938471029');
    expect(restored.blockedRestoreCount).toBe(1);
    expect(restored.restoredCount).toBe(0);
  });

  it('should prevent cross-tenant access to mapping handles', () => {
    const raw = 'Email: client@domain.com';
    const entities = [
      {
        id: 'e3',
        type: 'EMAIL_ADDRESS',
        category: 'pii' as const,
        placeholder: '<EMAIL_1>',
        originalMasked: 'cl••••••om',
        start: 7,
        end: 24,
        severity: 'medium' as const,
        detector: 'Regex',
        action: 'mask' as const,
        confidence: 0.98,
      },
    ];

    const mapping = placeholderService.createMapping(raw, entities, 'user-A', 'org-A');

    // Attempt retrieval by unauthorized user-B / org-B
    const restored = placeholderService.restorePermittedPlaceholders(
      'Echo <EMAIL_1>',
      mapping.mappingHandle,
      'user-B',
      'org-B'
    );

    // Cross-tenant access must be rejected
    expect(restored.restoredText).toBe('Echo <EMAIL_1>');
    expect(restored.restoredCount).toBe(0);
  });
});
