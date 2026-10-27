import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { authenticate } from './middleware/authenticate.js';
import { apiRateLimiter } from './middleware/rate-limit.js';
import { errorHandler } from './middleware/error-handler.js';

import { healthRoutes } from './routes/health.routes.js';
import { zeroleakRoutes } from './routes/zeroleak.routes.js';
import { chatRoutes } from './routes/chat.routes.js';
import { historyRoutes } from './routes/history.routes.js';
import { settingsRoutes } from './routes/settings.routes.js';
import { filesRoutes } from './routes/files.routes.js';

export function createApp() {
  const app = express();

  // 1. Security & Basic Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: [env.FRONTEND_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 2. Request Tracking & Global Rate Limit
  app.use(requestIdMiddleware);
  app.use('/api', apiRateLimiter);

  // 3. Authentication Context
  app.use(authenticate);

  // 4. API Endpoints
  const apiRouter = express.Router();
  apiRouter.use(healthRoutes);
  apiRouter.use(zeroleakRoutes);
  apiRouter.use(chatRoutes);
  apiRouter.use(historyRoutes);
  apiRouter.use(settingsRoutes);
  apiRouter.use(filesRoutes);

  app.use('/api/v1/zeroleak', apiRouter);

  // 5. Global Error Handler
  app.use(errorHandler);

  return app;
}
