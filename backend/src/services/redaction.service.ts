import { detectionService } from './detection.service.js';
import { placeholderService } from './placeholder.service.js';
import { regexDetector } from './regex-detector.service.js';
import { SensitiveEntity, RiskLevel, PolicyAction } from '../types/index.js';
import { env } from '../config/env.js';

export interface RedactionResult {
  sanitizedText: string;
  mappingHandle: string;
  hasSensitiveData: boolean;
  blocked: boolean;
  blockedReason?: string;
  entities: SensitiveEntity[];
  riskScore: number;
  riskLevel: RiskLevel;
  action: PolicyAction;
  detectedCount: number;
  redactedCount: number;
  processingTimeMs: number;
  verificationPassed: boolean;
}

export class RedactionService {
  public async sanitizePayload(
    rawText: string,
    userId: string,
    organizationId: string,
    options: {
      inputType?: 'prompt' | 'code' | 'file';
      enablePresidio?: boolean;
      enableGitleaks?: boolean;
    } = {}
  ): Promise<RedactionResult> {
    const startTime = performance.now();

    if (!rawText || rawText.trim().length === 0) {
      return {
        sanitizedText: rawText,
        mappingHandle: '',
        hasSensitiveData: false,
        blocked: false,
        entities: [],
        riskScore: 0,
        riskLevel: 'low',
        action: 'allow',
        detectedCount: 0,
        redactedCount: 0,
        processingTimeMs: 0,
        verificationPassed: true,
      };
    }

    // 1. First Pass: Detect all sensitive entities
    const detection = await detectionService.detectAll(rawText, options);

    // If policy dictates blocking upfront
    if (detection.blocked) {
      const duration = Math.round(performance.now() - startTime);
      return {
        sanitizedText: rawText,
        mappingHandle: '',
        hasSensitiveData: true,
        blocked: true,
        blockedReason: detection.blockedReason || 'Critical credential blocked by ZeroLeak Fail-Closed policy.',
        entities: detection.entities,
        riskScore: detection.riskScore,
        riskLevel: detection.riskLevel,
        action: 'block',
        detectedCount: detection.entities.length,
        redactedCount: 0,
        processingTimeMs: duration,
        verificationPassed: false,
      };
    }

    // 2. Perform Redaction with ephemeral mapping
    const mapping = placeholderService.createMapping(
      rawText,
      detection.entities,
      userId,
      organizationId
    );

    // 3. Fail-Closed Verification Pass: Re-scan the sanitized payload
    // If ANY residual secret pattern matches the sanitized string, fail closed!
    const rescanEntities = regexDetector.detect(mapping.sanitizedText);
    const residualCritical = rescanEntities.filter(
      (e) => e.severity === 'critical' || e.action === 'block'
    );

    if (residualCritical.length > 0 && env.FAIL_CLOSED) {
      placeholderService.releaseMapping(mapping.mappingHandle);
      const duration = Math.round(performance.now() - startTime);
      return {
        sanitizedText: rawText,
        mappingHandle: '',
        hasSensitiveData: true,
        blocked: true,
        blockedReason: `Residual sensitive credential detected during post-redaction re-scan (${residualCritical[0].type}). Fail-closed safeguard engaged.`,
        entities: [...detection.entities, ...residualCritical],
        riskScore: 95,
        riskLevel: 'critical',
        action: 'block',
        detectedCount: detection.entities.length + residualCritical.length,
        redactedCount: 0,
        processingTimeMs: duration,
        verificationPassed: false,
      };
    }

    const duration = Math.round(performance.now() - startTime);
    return {
      sanitizedText: mapping.sanitizedText,
      mappingHandle: mapping.mappingHandle,
      hasSensitiveData: detection.hasSensitiveData,
      blocked: false,
      entities: detection.entities,
      riskScore: detection.riskScore,
      riskLevel: detection.riskLevel,
      action: detection.recommendedAction,
      detectedCount: detection.entities.length,
      redactedCount: mapping.entitiesCount,
      processingTimeMs: duration,
      verificationPassed: true,
    };
  }
}

export const redactionService = new RedactionService();
