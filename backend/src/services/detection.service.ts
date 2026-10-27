import { SensitiveEntity, RiskLevel, PolicyAction } from '../types/index.js';
import { regexDetector } from './regex-detector.service.js';
import { presidioClient } from './presidio-client.service.js';
import { gitleaksService } from './gitleaks.service.js';

export class DetectionService {
  public async detectAll(
    text: string,
    options: {
      enablePresidio?: boolean;
      enableGitleaks?: boolean;
      inputType?: 'prompt' | 'code' | 'file';
    } = {}
  ): Promise<{
    entities: SensitiveEntity[];
    hasSensitiveData: boolean;
    riskScore: number;
    riskLevel: RiskLevel;
    recommendedAction: PolicyAction;
    blocked: boolean;
    blockedReason?: string;
  }> {
    if (!text || text.trim().length === 0) {
      return {
        entities: [],
        hasSensitiveData: false,
        riskScore: 0,
        riskLevel: 'low',
        recommendedAction: 'allow',
        blocked: false,
      };
    }

    const {
      enablePresidio = true,
      enableGitleaks = options.inputType === 'code',
    } = options;

    // 1. Run local Regex detector
    const regexEntities = regexDetector.detect(text);

    // 2. Run Presidio Analyzer concurrently if enabled
    let presidioEntities: SensitiveEntity[] = [];
    if (enablePresidio) {
      try {
        presidioEntities = await presidioClient.analyze(text);
      } catch {
        presidioEntities = [];
      }
    }

    // 3. Run Gitleaks CLI if enabled
    let gitleaksEntities: SensitiveEntity[] = [];
    if (enableGitleaks) {
      try {
        gitleaksEntities = await gitleaksService.scanContent(text);
      } catch {
        gitleaksEntities = [];
      }
    }

    // 4. Merge all entities and resolve overlaps
    const allEntities = [...regexEntities, ...presidioEntities, ...gitleaksEntities];
    const resolved = this.resolveOverlaps(allEntities);

    // 5. Evaluate policy outcomes and risk scores
    let shouldBlock = false;
    let blockReason = '';

    for (const e of resolved) {
      if (e.action === 'block' || e.severity === 'critical') {
        shouldBlock = true;
        blockReason = `Critical credential detected: ${e.type} (${e.detector})`;
      }
    }

    const hasSensitiveData = resolved.length > 0;
    let riskScore = 0;
    let riskLevel: RiskLevel = 'low';

    if (hasSensitiveData) {
      if (shouldBlock || resolved.some((e) => e.severity === 'critical')) {
        riskScore = 88;
        riskLevel = 'critical';
      } else if (resolved.some((e) => e.severity === 'high')) {
        riskScore = 65;
        riskLevel = 'high';
      } else if (resolved.some((e) => e.severity === 'medium')) {
        riskScore = 38;
        riskLevel = 'medium';
      } else {
        riskScore = 15;
        riskLevel = 'low';
      }
    }

    return {
      entities: resolved,
      hasSensitiveData,
      riskScore,
      riskLevel,
      recommendedAction: shouldBlock ? 'block' : hasSensitiveData ? 'mask' : 'allow',
      blocked: shouldBlock,
      blockedReason: blockReason || undefined,
    };
  }

  private resolveOverlaps(entities: SensitiveEntity[]): SensitiveEntity[] {
    if (entities.length <= 1) return entities;

    // Sort by start offset ascending, then by severity/length
    const severityWeight: Record<RiskLevel, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    entities.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      const weightDiff = severityWeight[b.severity] - severityWeight[a.severity];
      if (weightDiff !== 0) return weightDiff;
      return (b.end - b.start) - (a.end - a.start);
    });

    const resolved: SensitiveEntity[] = [];
    let currentEnd = -1;

    for (const entity of entities) {
      if (entity.start >= currentEnd) {
        resolved.push(entity);
        currentEnd = entity.end;
      }
    }

    return resolved;
  }
}

export const detectionService = new DetectionService();
