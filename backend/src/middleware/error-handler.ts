import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId || 'unknown';

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request schema or parameters.',
        details: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
        requestId,
      },
    });
    return;
  }

  // 2. Standard Application / Security Errors
  const rawMessage = err instanceof Error ? err.message : 'Internal Server Error';

  // Sanitize message to never leak raw connection strings or secrets
  const sanitizedMessage = rawMessage
    .replace(/(?:postgresql|postgres|mysql|mongodb):\/\/[^\s"']+/gi, '[REDACTED_DB_URI]')
    .replace(/(?:sk|rk)_(?:live|test)_[0-9a-zA-Z_]{16,}/g, '[REDACTED_SECRET]')
    .replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_API_KEY]');

  console.error(`[ZeroLeak Gateway Error #${requestId}]`, sanitizedMessage);

  res.status(500).json({
    error: {
      code: 'INTERNAL_GATEWAY_ERROR',
      message: 'An unexpected error occurred within ZeroLeak Gateway.',
      safeDetails: sanitizedMessage,
      requestId,
    },
  });
}
