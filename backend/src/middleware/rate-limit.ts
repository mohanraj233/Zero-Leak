import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.RATE_LIMIT_MAX_PER_MINUTE,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests dispatched to ZeroLeak Gateway. Please retry in 60 seconds.',
    },
  },
});

export const strictChatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // 30 AI prompts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'AI_CHAT_RATE_LIMIT',
      message: 'AI chat prompt rate limit reached. Outbound egress slowed to prevent quota exhaustion.',
    },
  },
});
