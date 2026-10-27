import { SensitiveEntity, RiskLevel, PolicyAction } from '../types/index.js';
import { env } from '../config/env.js';

interface PresidioAnalyzeResult {
  entity_type: string;
  start: number;
  end: number;
  score: number;
  analysis_explanation?: unknown;
}

export class PresidioClientService {
  private serviceUrl: string;
  private token: string;
  private isAvailable: boolean | null = null;

  constructor() {
    this.serviceUrl = env.PRESIDIO_SERVICE_URL.replace(/\/+$/, '');
    this.token = env.INTERNAL_SERVICE_TOKEN;
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.serviceUrl}/health`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
        signal: AbortSignal.timeout(2000),
      });
      this.isAvailable = res.ok;
      return res.ok;
    } catch {
      this.isAvailable = false;
      return false;
    }
  }

  public async analyze(text: string, language = 'en'): Promise<SensitiveEntity[]> {
    if (!text || text.trim().length === 0) {
      return [];
    }

    try {
      const res = await fetch(`${this.serviceUrl}/api/v1/presidio/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({ text, language }),
        signal: AbortSignal.timeout(4000),
      });

      if (!res.ok) {
        return [];
      }

      const results = (await res.json()) as PresidioAnalyzeResult[];
      const entities: SensitiveEntity[] = [];

      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        const matchedSubstring = text.slice(item.start, item.end);
        const maskedLength = matchedSubstring.length;
        const originalMasked =
          maskedLength > 6
            ? `${matchedSubstring.slice(0, 2)}••••••${matchedSubstring.slice(-2)}`
            : '••••••';

        let severity: RiskLevel = 'medium';
        let action: PolicyAction = 'mask';
        let category: SensitiveEntity['category'] = 'pii';

        if (['CREDIT_CARD', 'CRYPTO', 'IBAN_CODE'].includes(item.entity_type)) {
          severity = 'critical';
          action = 'block';
          category = 'financial';
        } else if (['US_SSN', 'PASSPORT', 'MEDICAL_LICENSE'].includes(item.entity_type)) {
          severity = 'critical';
          action = 'block';
          category = 'pii';
        } else if (['IP_ADDRESS'].includes(item.entity_type)) {
          severity = 'low';
          action = 'mask';
          category = 'internal';
        }

        entities.push({
          id: `presidio-${i + 1}-${Date.now()}`,
          type: item.entity_type,
          category,
          placeholder: `<${item.entity_type}_${i + 1}>`,
          originalMasked,
          start: item.start,
          end: item.end,
          severity,
          detector: 'Microsoft Presidio Analyzer',
          action,
          confidence: Number(item.score.toFixed(2)),
        });
      }

      return entities;
    } catch (err) {
      // Graceful offline fallback
      return [];
    }
  }
}

export const presidioClient = new PresidioClientService();
