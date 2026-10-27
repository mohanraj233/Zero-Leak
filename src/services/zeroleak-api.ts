/**
 * ZeroLeak AI Gateway Service Layer
 * Connects the Next.js frontend to the Express/Drizzle backend service:
 * - GET  /api/v1/zeroleak/health
 * - POST /api/v1/zeroleak/inspect
 * - POST /api/v1/zeroleak/redact
 * - POST /api/v1/zeroleak/validate
 * - POST /api/v1/zeroleak/ai-chat
 * - GET  /api/v1/zeroleak/metrics
 * - GET  /api/v1/zeroleak/audit-logs
 * - GET  /api/v1/zeroleak/policy
 * - PATCH /api/v1/zeroleak/policy/rules/:id
 * - POST /api/v1/zeroleak/files/redact
 * - GET  /api/v1/zeroleak/history
 */

import {
  InspectionResult,
  PolicyRule,
  DetectionCategory,
  DashboardMetrics,
  ActivityLogItem,
} from '@/types/zeroleak';
import { inspectAndRedactText } from './zeroleak-mock';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_ZEROLEAK_API_URL || 'http://localhost:4000';

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
  prompt: string;
  sessionId?: string;
  contextId?: string;
}

export interface ValidateRequest {
  ruleId?: string;
  regexPattern: string;
  testInput: string;
}

class ZeroLeakApiClient {
  private getBaseUrl(): string {
    return API_BASE_URL.replace(/\/+$/, '');
  }

  /**
   * Health check of ZeroLeak gateway
   */
  async checkHealth(): Promise<{
    status: string;
    version: string;
    components: Record<string, unknown>;
  } | null> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/v1/zeroleak/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Inspects a payload for secrets & PII
   */
  async inspect(req: InspectRequest): Promise<InspectionResult> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/zeroleak/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      if (!response.ok) {
        throw new Error(`Inspect API returned ${response.status}`);
      }

      return (await response.json()) as InspectionResult;
    } catch {
      // Local fallback
      return inspectAndRedactText(req.payload, req.policyRules);
    }
  }

  /**
   * Redacts sensitive entities and returns sanitized text with opaque placeholder keys
   */
  async redact(req: RedactRequest): Promise<{
    sanitizedText: string;
    mappingHandle?: string;
    entityCount: number;
    hasSensitiveData: boolean;
    blocked: boolean;
    blockedReason?: string;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/zeroleak/redact`, {
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
      return {
        sanitizedText: result.sanitizedText,
        entityCount: result.entities.length,
        hasSensitiveData: result.hasSensitiveData,
        blocked: result.blocked,
        blockedReason: result.blockedReason,
      };
    }
  }

  /**
   * Dispatches the prompt to the AI chat endpoint
   */
  async sendAiChat(req: AiChatRequest): Promise<{
    content: string;
    remediationSnippet?: { title: string; code: string; language: string };
    securityVerdict?: string;
    securityNote?: string;
    blocked?: boolean;
    detectedCount?: number;
    redactedCount?: number;
  }> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/zeroleak/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          content: data.content || data.error?.message || 'Outbound egress blocked by ZeroLeak Gateway.',
          securityVerdict: data.securityVerdict || 'blocked',
          blocked: true,
          securityNote: data.securityNote || 'Request aborted per Fail-Closed policy.',
        };
      }

      return data;
    } catch {
      return {
        content: `[ZeroLeak Gateway: Standby Mode]\n\nBackend service at ${this.getBaseUrl()} is not connected. Outbound egress halted per Fail-Closed policy.`,
        securityVerdict: 'review_required',
        securityNote: 'Client-side inspection completed. External egress halted.',
      };
    }
  }

  /**
   * Tests a regex expression against sample input
   */
  async validateRegex(req: ValidateRequest): Promise<{
    valid: boolean;
    matched: boolean;
    matches: string[];
    executionTimeMs: number;
    error?: string;
  }> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/v1/zeroleak/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });

      return await res.json();
    } catch {
      // Local fallback
      const startTime = performance.now();
      try {
        const re = new RegExp(req.regexPattern, 'g');
        const matches: string[] = [];
        let match;
        while ((match = re.exec(req.testInput)) !== null) {
          matches.push(match[0]);
          if (matches.length > 50) break;
        }
        return {
          valid: true,
          matched: matches.length > 0,
          matches,
          executionTimeMs: Math.max(0.1, Number((performance.now() - startTime).toFixed(2))),
        };
      } catch (err) {
        return {
          valid: false,
          matched: false,
          matches: [],
          executionTimeMs: 0,
          error: err instanceof Error ? err.message : 'Invalid regex',
        };
      }
    }
  }

  /**
   * Fetches live metrics from backend
   */
  async getMetrics(): Promise<DashboardMetrics | null> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/v1/zeroleak/metrics`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return data.metrics;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Fetches metadata audit logs
   */
  async getAuditLogs(filter?: string): Promise<ActivityLogItem[]> {
    try {
      const url = filter
        ? `${this.getBaseUrl()}/api/v1/zeroleak/audit-logs?filter=${encodeURIComponent(filter)}`
        : `${this.getBaseUrl()}/api/v1/zeroleak/audit-logs`;
      const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return data.logs;
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Fetches policy categories & rules
   */
  async getPolicyCategories(): Promise<DetectionCategory[] | null> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/v1/zeroleak/policy`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        return data.categories;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Updates an individual policy rule
   */
  async updatePolicyRule(
    ruleId: string,
    updates: { actionOverride?: string; enabled?: boolean }
  ): Promise<boolean> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/api/v1/zeroleak/policy/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Uploads and redacts a file
   */
  async uploadFile(file: File): Promise<{
    fileId: string;
    originalFilename: string;
    sanitizedFilename: string;
    detectedCount: number;
    redactedCount: number;
    status: string;
    downloadUrl: string;
  } | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${this.getBaseUrl()}/api/v1/zeroleak/files/redact`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const zeroleakApi = new ZeroLeakApiClient();
