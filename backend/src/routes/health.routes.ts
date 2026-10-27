import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '../db/index.js';
import { geminiService } from '../services/gemini.service.js';
import { presidioClient } from '../services/presidio-client.service.js';
import { gitleaksService } from '../services/gitleaks.service.js';

const router = Router();

router.get('/health', async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const geminiStatus = geminiService.getStatus();
  const presidioHealth = await presidioClient.checkHealth();
  const gitleaksHealth = await gitleaksService.isAvailable();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ZeroLeak AI Gateway & DLP Engine',
    version: '2.4.0',
    requestId: req.requestId,
    components: {
      database: dbHealth,
      geminiProvider: geminiStatus,
      presidioService: { available: presidioHealth },
      gitleaksCli: { installed: gitleaksHealth },
      failClosedArmed: true,
    },
  });
});

export const healthRoutes = router;
