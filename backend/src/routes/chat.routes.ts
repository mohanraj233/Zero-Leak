import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { redactionService } from '../services/redaction.service.js';
import { geminiService, resolveModel } from '../services/gemini.service.js';
import { responseInspectionService } from '../services/response-inspection.service.js';
import { placeholderService } from '../services/placeholder.service.js';
import { auditService } from '../services/audit.service.js';
import { strictChatLimiter } from '../middleware/rate-limit.js';
import { getDb, schema } from '../db/index.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const chatRequestSchema = z.object({
  model: z.string().optional(),
  prompt: z.string().min(1, 'Prompt cannot be empty').max(30000, 'Prompt exceeds 30KB limit'),
  sessionId: z.string().optional(),
  contextId: z.string().optional(),
});

router.post('/ai-chat', strictChatLimiter, async (req: Request, res: Response, next: NextFunction) => {
  const startTime = performance.now();

  try {
    const { model: requestedModel, prompt, sessionId } = chatRequestSchema.parse(req.body);
    const authoritativeModel = resolveModel(requestedModel);

    // 1. Redact input prompt and acquire ephemeral mapping
    const redaction = await redactionService.sanitizePayload(
      prompt,
      req.user.id,
      req.user.organizationId,
      { inputType: 'prompt' }
    );

    // 2. If blocked by Fail-Closed safeguard: Halt egress immediately!
    if (redaction.blocked) {
      const latencyMs = Math.round(performance.now() - startTime);

      await auditService.recordLog({
        organizationId: req.user.organizationId,
        userId: req.user.id,
        requestId: req.requestId,
        operation: 'AI_CHAT',
        provider: 'Google Gemini',
        model: authoritativeModel,
        detectedCount: redaction.detectedCount,
        redactedCount: 0,
        policyAction: 'block',
        outcome: 'Blocked',
        latencyMs,
      });

      res.status(400).json({
        content: `[ZeroLeak Gateway: Blocked per Fail-Closed Policy]\n\n${redaction.blockedReason || 'Critical secret credentials detected in prompt stream. External LLM transmission aborted.'}`,
        securityVerdict: 'blocked',
        blocked: true,
        detectedCount: redaction.detectedCount,
        redactedCount: 0,
        entities: redaction.entities,
        securityNote: 'Zero-exposure guarantee: No raw credentials were transmitted over the network.',
        requestId: req.requestId,
      });
      return;
    }

    let finalContent = '';
    let aiResponse: Awaited<ReturnType<typeof geminiService.generateChatCompletion>>;
    let responseCheck: ReturnType<typeof responseInspectionService.inspectModelResponse>;
    let mappingReleased = false;

    try {
      // 3. Call Google Gemini with SANITIZED content ONLY using authoritative model
      aiResponse = await geminiService.generateChatCompletion(
        redaction.sanitizedText,
        authoritativeModel
      );

      // 4. Scan AI Response for newly leaked credentials or echoes
      responseCheck = responseInspectionService.inspectModelResponse(aiResponse.content);
      finalContent = responseCheck.sanitizedResponse;

      // 5. Restore ONLY permitted placeholders (PII) if mapping exists and response is safe
      if (redaction.mappingHandle && !aiResponse.content.includes('[ZeroLeak Gateway: Provider Error]')) {
        const restoration = placeholderService.restorePermittedPlaceholders(
          finalContent,
          redaction.mappingHandle,
          req.user.id,
          req.user.organizationId
        );
        finalContent = restoration.restoredText;
      }
    } finally {
      // Ephemeral mapping cleanup guaranteed in finally block even on provider errors
      if (redaction.mappingHandle && !mappingReleased) {
        placeholderService.releaseMapping(redaction.mappingHandle);
        mappingReleased = true;
      }
    }

    const latencyMs = Math.round(performance.now() - startTime);

    // 6. Write sanitized chat history if session is provided
    if (sessionId) {
      try {
        const db = getDb();
        // Persist user sanitized prompt
        await db.insert(schema.chatMessages).values({
          id: `msg-${uuidv4()}`,
          sessionId,
          role: 'user',
          sanitizedContent: redaction.sanitizedText,
          status: redaction.hasSensitiveData ? 'redacted' : 'clean',
        });

        // Persist assistant sanitized response
        await db.insert(schema.chatMessages).values({
          id: `msg-${uuidv4()}`,
          sessionId,
          role: 'assistant',
          sanitizedContent: finalContent,
          status: 'safe_response',
        });
      } catch (dbErr) {
        console.warn('[ZeroLeak Chat History] Failed to persist chat messages to DB:', dbErr);
      }
    }

    // 7. Write metadata-only audit log
    await auditService.recordLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      requestId: req.requestId,
      operation: 'AI_CHAT',
      provider: 'Google Gemini',
      model: authoritativeModel,
      detectedCount: redaction.detectedCount,
      redactedCount: redaction.redactedCount,
      policyAction: redaction.action,
      outcome: redaction.hasSensitiveData ? 'Sanitized' : 'Passed',
      latencyMs,
    });

    res.json({
      content: finalContent,
      remediationSnippet: aiResponse.remediationSnippet,
      securityVerdict: responseCheck.securityVerdict,
      blocked: false,
      detectedCount: redaction.detectedCount,
      redactedCount: redaction.redactedCount,
      entities: redaction.entities,
      securityNote: aiResponse.securityNote || 'Payload sanitized through ZeroLeak Fail-Closed Gateway.',
      latencyMs,
      requestId: req.requestId,
    });
  } catch (err) {
    next(err);
  }
});

export const chatRoutes = router;
