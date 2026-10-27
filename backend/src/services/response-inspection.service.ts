import { regexDetector } from './regex-detector.service.js';
import { SensitiveEntity } from '../types/index.js';

export interface ResponseInspectionResult {
  isSafe: boolean;
  containsEchoedSecret: boolean;
  detectedEntities: SensitiveEntity[];
  sanitizedResponse: string;
  securityVerdict: 'safe' | 'redacted' | 'blocked' | 'review_required';
  note?: string;
}

export class ResponseInspectionService {
  public inspectModelResponse(responseText: string): ResponseInspectionResult {
    if (!responseText || responseText.trim().length === 0) {
      return {
        isSafe: true,
        containsEchoedSecret: false,
        detectedEntities: [],
        sanitizedResponse: responseText,
        securityVerdict: 'safe',
      };
    }

    // Scan LLM output for leaked/echoed credentials
    const findings = regexDetector.detect(responseText);

    if (findings.length === 0) {
      return {
        isSafe: true,
        containsEchoedSecret: false,
        detectedEntities: [],
        sanitizedResponse: responseText,
        securityVerdict: 'safe',
      };
    }

    // Critical credentials detected in model response!
    const hasCritical = findings.some((f) => f.severity === 'critical' || f.action === 'block');

    if (hasCritical) {
      return {
        isSafe: false,
        containsEchoedSecret: true,
        detectedEntities: findings,
        sanitizedResponse:
          '[ZeroLeak Guard: Model response contained sensitive credential patterns and was intercepted per Fail-Closed policy.]',
        securityVerdict: 'blocked',
        note: `Model generated or echoed sensitive patterns: ${findings.map((f) => f.type).join(', ')}`,
      };
    }

    // Scrub moderate PII in model output
    let sanitized = responseText;
    const sorted = [...findings].sort((a, b) => b.start - a.start);
    for (const f of sorted) {
      sanitized = sanitized.slice(0, f.start) + f.placeholder + sanitized.slice(f.end);
    }

    return {
      isSafe: true,
      containsEchoedSecret: false,
      detectedEntities: findings,
      sanitizedResponse: sanitized,
      securityVerdict: 'redacted',
      note: `${findings.length} sensitive entity pattern(s) sanitized in model output stream.`,
    };
  }
}

export const responseInspectionService = new ResponseInspectionService();
