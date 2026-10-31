import { resolveModel, SUPPORTED_GEMINI_MODELS, GeminiService } from '../src/services/gemini.service.js';
import { env } from '../src/config/env.js';
import { placeholderService } from '../src/services/placeholder.service.js';
import { redactionService } from '../src/services/redaction.service.js';

describe('ZeroLeak Gemini Service & Model Governance Regression Tests', () => {
  const userId = 'usr-test-governance-01';
  const orgId = 'org-test-governance-01';

  describe('1. Model Resolution & Allowlist Enforcement', () => {
    it('should use authoritative env configured model when client sends undefined or empty model', () => {
      const resolvedEmpty = resolveModel('');
      const resolvedUndefined = resolveModel(undefined);

      expect(resolvedEmpty).toBe(env.GEMINI_MODEL || 'gemini-3.8-flash');
      expect(resolvedUndefined).toBe(env.GEMINI_MODEL || 'gemini-3.8-flash');
    });

    it('should strip UI display labels and proxy wrappers, resolving strictly to verified API IDs', () => {
      expect(resolveModel('Gemini 3.8 Flash (Server Proxy)')).toBe('gemini-3.8-flash');
      expect(resolveModel('Gemini 3.8 Flash')).toBe('gemini-3.8-flash');
      expect(resolveModel('gemini-3.5-flash')).toBe('gemini-3.5-flash');
      expect(resolveModel('Claude 3.5 Sonnet (Proxy)')).toBe('gemini-3.5-flash');
      expect(resolveModel('GPT-OSS 120B (Proxy)')).toBe('gemini-3.5-flash');
      expect(resolveModel('Claude Opus 4.6 (Proxy)')).toBe('gemini-3.5-flash');
    });

    it('should auto-upgrade deprecated gemini-2.5-flash to active gemini-3.5-flash', () => {
      expect(resolveModel('gemini-2.5-flash')).toBe('gemini-3.5-flash');
      expect(resolveModel('Gemini 2.5 Flash')).toBe('gemini-3.5-flash');
    });

    it('should reject arbitrary or malicious model strings and fall back safely to configured env model', () => {
      const arbitraryMalicious = '../../../etc/passwd';
      expect(resolveModel(arbitraryMalicious)).toBe(env.GEMINI_MODEL || 'gemini-3.8-flash');

      const nonExistentModel = 'gpt-999-ultra-secret';
      expect(resolveModel(nonExistentModel)).toBe(env.GEMINI_MODEL || 'gemini-3.8-flash');
    });

    it('should accept explicitly supported models in the allowlist', () => {
      for (const m of SUPPORTED_GEMINI_MODELS) {
        expect(resolveModel(m)).toBe(m);
      }
    });
  });

  describe('2. Gemini Service Provider Responses & Timeout Handling', () => {
    let service: GeminiService;

    beforeEach(() => {
      service = new GeminiService();
    });

    it('should report healthy provider status without exposing credentials', () => {
      const status = service.getStatus();
      expect(status).toHaveProperty('configured');
      expect(status).toHaveProperty('model');
      expect(status).toHaveProperty('timeoutMs');
      expect(status.model).toBe(resolveModel(env.GEMINI_MODEL));
      expect(status.timeoutMs).toBe(60000);
      // Ensure no API keys or secrets are leaked in status
      expect(JSON.stringify(status)).not.toContain('AQ.');
      expect(JSON.stringify(status)).not.toContain('AIza');
    });

    it('should return fail-closed Standby Mode response when API key is missing', async () => {
      // Create a test instance with null client
      const unconfiguredService = new GeminiService();
      // @ts-expect-error accessing private property for unit test
      unconfiguredService.client = null;
      // @ts-expect-error accessing private property for unit test
      unconfiguredService.isConfigured = false;

      const response = await unconfiguredService.generateChatCompletion('How do I secure an API?');
      expect(response.content).toContain('ZeroLeak Gateway: Standby Mode');
      expect(response.securityNote).toContain('Provider transmission halted');
      expect(response.model).toBe(resolveModel(env.GEMINI_MODEL));
    });

    it('should parse and return code remediation snippet when model returns a code block', async () => {
      const mockGenerateContent = jest.fn().mockResolvedValue({
        response: {
          text: () => 'Here is the fix:\n```typescript\nconst safeSecret = process.env.API_KEY;\n```\nMake sure to use env vars.',
        },
      });

      const mockClient = {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      };

      // @ts-expect-error inject mock client
      service.client = mockClient;
      // @ts-expect-error set configured
      service.isConfigured = true;

      const res = await service.generateChatCompletion('sanitized prompt text');
      expect(res.content).toContain('Here is the fix:');
      expect(res.remediationSnippet).toBeDefined();
      expect(res.remediationSnippet?.language).toBe('typescript');
      expect(res.remediationSnippet?.code).toContain('process.env.API_KEY');
    });

    it('should produce a bounded safe provider error on timeout without crashing', async () => {
      const mockGenerateContent = jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          const err = new Error('This operation was aborted');
          setTimeout(() => reject(err), 50);
        });
      });

      const mockClient = {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      };

      // @ts-expect-error inject mock client
      service.client = mockClient;
      // @ts-expect-error set configured
      service.isConfigured = true;

      const res = await service.generateChatCompletion('test prompt');
      expect(res.content).toContain('Provider Error');
      expect(res.content).toContain('Gemini API call timed out');
      expect(res.securityNote).toContain('Provider timeout encountered');
    });

    it('should not retry non-retryable 4xx or authentication errors', async () => {
      let callCount = 0;
      const mockGenerateContent = jest.fn().mockImplementation(() => {
        callCount++;
        return Promise.reject(new Error('[401 Unauthorized] Invalid API key provided.'));
      });

      const mockClient = {
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: mockGenerateContent,
        }),
      };

      // @ts-expect-error inject mock client
      service.client = mockClient;
      // @ts-expect-error set configured
      service.isConfigured = true;

      const res = await service.generateChatCompletion('test prompt');
      expect(callCount).toBe(1); // Exactly 1 call: NO endless retry on 401
      expect(res.content).toContain('Provider Error');
      expect(res.content).toContain('Invalid API key');
    });
  });

  describe('3. Fail-Closed Invariants & Ephemeral Lifecycle Guarantee', () => {
    it('should prevent external transmission when critical secrets are detected', async () => {
      const sensitivePrompt = 'AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';
      const scan = await redactionService.sanitizePayload(sensitivePrompt, userId, orgId);

      expect(scan.blocked).toBe(true);
      expect(scan.action).toBe('block');
      expect(scan.blockedReason).toContain('AWS');
    });

    it('should cleanly release ephemeral mapping handle after lifecycle completes', () => {
      const prompt = 'Please reply to ops@company.org';
      const entities = [
        {
          id: 'ent-1',
          type: 'EMAIL_ADDRESS',
          category: 'pii' as const,
          placeholder: '<EMAIL_1>',
          originalMasked: 'op••••••rg',
          start: 16,
          end: 31,
          severity: 'medium' as const,
          detector: 'Regex',
          action: 'mask' as const,
          confidence: 0.99,
        },
      ];

      const { mappingHandle } = placeholderService.createMapping(prompt, entities, userId, orgId);
      expect(placeholderService.hasMapping(mappingHandle)).toBe(true);

      // Explicitly release mapping (simulating the finally block)
      placeholderService.releaseMapping(mappingHandle);
      expect(placeholderService.hasMapping(mappingHandle)).toBe(false);

      // Verify that after release, attempting to restore returns sanitized content safely
      const attemptRestore = placeholderService.restorePermittedPlaceholders(
        'Email is <EMAIL_1>',
        mappingHandle,
        userId,
        orgId
      );
      expect(attemptRestore.restoredText).toBe('Email is <EMAIL_1>');
      expect(attemptRestore.restoredCount).toBe(0);
    });
  });
});

