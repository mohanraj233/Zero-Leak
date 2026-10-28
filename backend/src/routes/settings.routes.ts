import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getDb, schema } from '../db/index.js';
import { eq } from 'drizzle-orm';
import { policyService } from '../services/policy.service.js';
import { PolicyRule } from '../types/index.js';

const router = Router();

// 1. Get User Settings
router.get('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const settings = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, req.user.id))
      .limit(1);

    if (settings.length === 0) {
      res.json({
        requestId: req.requestId,
        settings: {
          defaultProvider: 'Google Gemini',
          defaultModel: 'gemini-3.8-flash',
          redactionPolicy: 'mask_reversible',
          historyEnabled: true,
        },
      });
      return;
    }

    res.json({
      requestId: req.requestId,
      settings: settings[0],
    });
  } catch (err) {
    next(err);
  }
});

// 2. Patch User Settings
router.patch('/settings', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patchSchema = z.object({
      defaultModel: z.string().optional(),
      defaultProvider: z.string().optional(),
      redactionPolicy: z.string().optional(),
      historyEnabled: z.boolean().optional(),
    });

    const data = patchSchema.parse(req.body);
    const db = getDb();

    const existing = await db
      .select()
      .from(schema.userSettings)
      .where(eq(schema.userSettings.userId, req.user.id));

    if (existing.length > 0) {
      await db
        .update(schema.userSettings)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(schema.userSettings.userId, req.user.id));
    } else {
      await db.insert(schema.userSettings).values({
        id: `settings-${req.user.id}`,
        userId: req.user.id,
        defaultModel: data.defaultModel || 'gemini-3.8-flash',
        defaultProvider: data.defaultProvider || 'Google Gemini',
        redactionPolicy: data.redactionPolicy || 'mask_reversible',
        historyEnabled: data.historyEnabled ?? true,
      });
    }

    res.json({
      requestId: req.requestId,
      success: true,
      updated: data,
    });
  } catch (err) {
    next(err);
  }
});

// 3. Get Policy Categories & Rules
router.get('/policy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await policyService.getCategories(req.user.organizationId);
    res.json({
      requestId: req.requestId,
      categories,
    });
  } catch (err) {
    next(err);
  }
});

// 4. Update Policy Rule
router.patch('/policy/rules/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ruleId = String(req.params.id);
    const ruleSchema = z.object({
      actionOverride: z.enum(['default', 'mask', 'block', 'warn', 'allow']).optional(),
      enabled: z.boolean().optional(),
    });

    const updates = ruleSchema.parse(req.body);
    await policyService.updateRule(
      req.user.organizationId,
      ruleId,
      updates as { actionOverride?: PolicyRule['actionOverride']; enabled?: boolean }
    );

    res.json({
      requestId: req.requestId,
      success: true,
      ruleId,
      updates,
    });
  } catch (err) {
    next(err);
  }
});

// 5. Export Policy Ruleset
router.get('/policy/export', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await policyService.getCategories(req.user.organizationId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="zeroleak-policy-ruleset-v2.4-${new Date().toISOString().slice(0, 10)}.json"`
    );
    res.send(JSON.stringify(categories, null, 2));
  } catch (err) {
    next(err);
  }
});

export const settingsRoutes = router;
