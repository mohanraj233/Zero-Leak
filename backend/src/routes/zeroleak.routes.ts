import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { detectionService } from '../services/detection.service.js';
import { redactionService } from '../services/redaction.service.js';
import { auditService } from '../services/audit.service.js';

const router = Router();

// Validation Schemas
const inspectSchema = z.object({
  payload: z.string().min(1, 'Payload cannot be empty').max(100000),
  sourceType: z.enum(['prompt', 'code', 'file']).optional().default('prompt'),
});

const redactSchema = z.object({
  payload: z.string().min(1, 'Payload cannot be empty').max(100000),
  strategy: z.enum(['mask', 'placeholder']).optional().default('placeholder'),
});

const validateSchema = z.object({
  regexPattern: z.string().min(1, 'Regex pattern cannot be empty').max(1000),
  testInput: z.string().max(20000).default(''),
});

// 1. Inspect Payload
router.post('/inspect', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payload, sourceType } = inspectSchema.parse(req.body);
    const startTime = performance.now();

    const result = await detectionService.detectAll(payload, {
      inputType: sourceType,
      enablePresidio: true,
      enableGitleaks: sourceType === 'code',
    });

    const latencyMs = Math.max(1, Math.round(performance.now() - startTime));

    // Log metadata only
    await auditService.recordLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      requestId: req.requestId,
      operation: 'INSPECT',
      detectedCount: result.entities.length,
      redactedCount: 0,
      policyAction: result.recommendedAction,
      outcome: result.blocked ? 'Blocked' : result.hasSensitiveData ? 'Sanitized' : 'Passed',
      latencyMs,
    });

    res.json({
      requestId: req.requestId,
      hasSensitiveData: result.hasSensitiveData,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      recommendedAction: result.recommendedAction,
      blocked: result.blocked,
      blockedReason: result.blockedReason,
      entities: result.entities,
      entityCount: result.entities.length,
      latencyMs,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Redact Payload
router.post('/redact', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { payload } = redactSchema.parse(req.body);

    const result = await redactionService.sanitizePayload(
      payload,
      req.user.id,
      req.user.organizationId
    );

    await auditService.recordLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      requestId: req.requestId,
      operation: 'REDACT',
      detectedCount: result.detectedCount,
      redactedCount: result.redactedCount,
      policyAction: result.action,
      outcome: result.blocked ? 'Blocked' : result.hasSensitiveData ? 'Sanitized' : 'Passed',
      latencyMs: result.processingTimeMs,
    });

    res.json({
      requestId: req.requestId,
      sanitizedText: result.sanitizedText,
      mappingHandle: result.mappingHandle,
      entityCount: result.redactedCount,
      hasSensitiveData: result.hasSensitiveData,
      blocked: result.blocked,
      blockedReason: result.blockedReason,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
      action: result.action,
      entities: result.entities,
      verificationPassed: result.verificationPassed,
      latencyMs: result.processingTimeMs,
    });
  } catch (err) {
    next(err);
  }
});

// 3. Validate Regex Pattern (Safe sandbox testing)
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { regexPattern, testInput } = validateSchema.parse(req.body);
    const startTime = performance.now();

    const matches: string[] = [];
    let isMatched = false;

    try {
      const re = new RegExp(regexPattern, 'g');
      let match: RegExpExecArray | null;
      while ((match = re.exec(testInput)) !== null) {
        matches.push(match[0]);
        if (matches.length >= 50) break; // bounded
      }
      isMatched = matches.length > 0;
    } catch (regexErr) {
      res.status(400).json({
        valid: false,
        error: regexErr instanceof Error ? regexErr.message : 'Invalid Regular Expression syntax',
        matches: [],
        executionTimeMs: 0,
      });
      return;
    }

    const latencyMs = Math.max(0.1, Number((performance.now() - startTime).toFixed(2)));

    res.json({
      valid: true,
      matched: isMatched,
      matches,
      matchCount: matches.length,
      executionTimeMs: latencyMs,
    });
  } catch (err) {
    next(err);
  }
});

// 4. Dashboard Metrics
router.get('/metrics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const metrics = await auditService.getDashboardMetrics(req.user.organizationId);
    res.json({
      requestId: req.requestId,
      metrics,
    });
  } catch (err) {
    next(err);
  }
});

// 5. Audit Logs
router.get('/audit-logs', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filter = typeof req.query.filter === 'string' ? req.query.filter : undefined;
    const logs = await auditService.getLogs(req.user.organizationId, 50, filter);
    res.json({
      requestId: req.requestId,
      logs,
      count: logs.length,
    });
  } catch (err) {
    next(err);
  }
});

export const zeroleakRoutes = router;
