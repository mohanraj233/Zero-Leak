/**
 * ZeroLeak AI Gateway Service Layer
 * Prepared for integration with Node.js/Express backend:
 * - POST /api/v1/zeroleak/inspect
 * - POST /api/v1/zeroleak/redact
 * - POST /api/v1/zeroleak/ai-chat
 * - POST /api/v1/zeroleak/validate
 */

import { InspectionResult, PolicyRule } from '@/types/zeroleak';
import { inspectAndRedactText, getSimulatedAiResponse } from './zeroleak-mock';

const API_BASE_URL = process.env.NEXT_PUBLIC_ZEROLEAK_API_URL || '';

export interface InspectRequest {
  payload: string;
  sourceType?: 'prompt' | 'code' | 'file';
  policyRules?: PolicyRule[];
}

export interface RedactRequest {
  payload: string;
  strategy?: 'mask' | 'placeholder';
}

export interface AiChatRequest {
  model: string;
  sanitizedPrompt: string;
  contextId?: string;
}

export interface ValidateRequest {
  ruleId: string;
  regexPattern: string;
  testInput: string;
}

class ZeroLeakApiClient {
  private isConfigured(): boolean {
    return Boolean(API_BASE_URL && API_BASE_URL.trim().length > 0);
  }

  /**
   * Inspects a payload for secrets & PII
   */
  async inspect(req: InspectRequest): Promise<InspectionResult> {
    if (!this.isConfigured()) {
      // Offline fallback: Use client-side safe inspector
      return inspectAndRedactText(req.payload, req.policyRules);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/zeroleak/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`Inspect API returned ${response.status}: ${response.statusText}`);
      }

      return (await response.json()) as InspectionResult;
    } catch (error) {
      console.warn('[ZeroLeak] Backend unreachable, falling back to local inspection engine.', error);
      return inspectAndRedactText(req.payload, req.policyRules);
    }
  }

  /**
   * Redacts sensitive entities and returns sanitized text with opaque placeholder keys
   */
  async redact(req: RedactRequest): Promise<{ sanitizedText: string; entityCount: number }> {
    if (!this.isConfigured()) {
      const result = inspectAndRedactText(req.payload);
      return { sanitizedText: result.sanitizedText, entityCount: result.entities.length };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/zeroleak/redact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`Redact API returned ${response.status}`);
      }

      return await response.json();
    } catch {
      const result = inspectAndRedactText(req.payload);
      return { sanitizedText: result.sanitizedText, entityCount: result.entities.length };
    }
  }

  /**
   * Dispatches the sanitized prompt to the AI chat endpoint (server-side provider call)
   */
  async sendAiChat(req: AiChatRequest): Promise<{
    content: string;
    remediationSnippet?: { title: string; code: string; language: string };
    securityNote?: string;
  }> {
    if (!this.isConfigured()) {
      // Simulate network latency (400ms - 800ms)
      await new Promise((resolve) => setTimeout(resolve, 550));
      return getSimulatedAiResponse(req.sanitizedPrompt, req.model);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/zeroleak/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`AI Chat API returned ${response.status}`);
      }

      return await response.json();
    } catch {
      return getSimulatedAiResponse(req.sanitizedPrompt, req.model);
    }
  }

  /**
   * Tests a regex expression against sample input
   */
  async validateRegex(req: ValidateRequest): Promise<{
    matched: boolean;
    matches: string[];
    executionTimeMs: number;
  }> {
    const startTime = performance.now();
    try {
      const re = new RegExp(req.regexPattern, 'g');
      const matches: string[] = [];
      let match;
      while ((match = re.exec(req.testInput)) !== null) {
        matches.push(match[0]);
      }
      const endTime = performance.now();
      return {
        matched: matches.length > 0,
        matches,
        executionTimeMs: Math.max(0.1, Number((endTime - startTime).toFixed(2))),
      };
    } catch {
      return {
        matched: false,
        matches: [],
        executionTimeMs: 0,
      };
    }
  }
}

export const zeroleakApi = new ZeroLeakApiClient();
