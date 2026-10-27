import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { getDb, schema } from '../db/index.js';
import { eq, desc, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 1. List user's sessions
router.get('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const db = getDb();
    const sessions = await db
      .select()
      .from(schema.chatSessions)
      .where(
        and(
          eq(schema.chatSessions.organizationId, req.user.organizationId),
          eq(schema.chatSessions.userId, req.user.id)
        )
      )
      .orderBy(desc(schema.chatSessions.createdAt));

    const conversations = sessions.map((s) => ({
      id: s.id,
      title: s.title,
      timestamp: s.createdAt.toLocaleDateString(),
      timeGroup: 'today',
      model: s.model,
      status: 'clean',
      messages: [],
    }));

    res.json({
      requestId: req.requestId,
      conversations,
      count: conversations.length,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Create new session
router.post('/history', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bodySchema = z.object({
      title: z.string().min(1).max(255).default('New Session'),
      model: z.string().default('gemini-2.5-flash'),
    });

    const { title, model } = bodySchema.parse(req.body);
    const id = `conv-${uuidv4()}`;
    const db = getDb();

    await db.insert(schema.chatSessions).values({
      id,
      organizationId: req.user.organizationId,
      userId: req.user.id,
      title,
      model,
    });

    res.status(201).json({
      requestId: req.requestId,
      session: {
        id,
        title,
        model,
        timestamp: 'Just now',
        messages: [],
      },
    });
  } catch (err) {
    next(err);
  }
});

// 3. Get session messages
router.get('/history/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = String(req.params.id);
    const db = getDb();

    // Verify session belongs to user/org
    const session = await db
      .select()
      .from(schema.chatSessions)
      .where(
        and(
          eq(schema.chatSessions.id, sessionId),
          eq(schema.chatSessions.organizationId, req.user.organizationId)
        )
      )
      .limit(1);

    if (session.length === 0) {
      res.status(404).json({
        error: { code: 'SESSION_NOT_FOUND', message: 'Chat session not found' },
      });
      return;
    }

    const messages = await db
      .select()
      .from(schema.chatMessages)
      .where(eq(schema.chatMessages.sessionId, sessionId))
      .orderBy(schema.chatMessages.createdAt);

    res.json({
      requestId: req.requestId,
      session: session[0],
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.sanitizedContent,
        status: m.status,
        timestamp: m.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })),
    });
  } catch (err) {
    next(err);
  }
});

// 4. Delete session
router.delete('/history/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = String(req.params.id);
    const db = getDb();

    await db
      .delete(schema.chatSessions)
      .where(
        and(
          eq(schema.chatSessions.id, sessionId),
          eq(schema.chatSessions.organizationId, req.user.organizationId)
        )
      );

    res.json({
      requestId: req.requestId,
      success: true,
      deletedSessionId: sessionId,
    });
  } catch (err) {
    next(err);
  }
});

export const historyRoutes = router;
