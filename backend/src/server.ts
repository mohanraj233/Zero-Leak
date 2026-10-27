import { createApp } from './app.js';
import { env } from './config/env.js';
import { checkDatabaseHealth } from './db/index.js';
import { seedDatabase } from './db/seed.js';

const app = createApp();

const server = app.listen(env.PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🛡️  ZeroLeak AI DLP Gateway running on port ${env.PORT}`);
  console.log(`🌐 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Health Check: http://localhost:${env.PORT}/api/v1/zeroleak/health`);
  console.log(`=======================================================`);

  // Verify database connection and seed defaults
  const dbHealth = await checkDatabaseHealth();
  if (dbHealth.connected) {
    console.log(`[ZeroLeak DB] Connected to ${dbHealth.provider}`);
    await seedDatabase();
  } else {
    console.log(`[ZeroLeak DB] Note: Database running in standby mode (${dbHealth.error})`);
  }
});

process.on('SIGTERM', () => {
  console.log('[ZeroLeak] SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('[ZeroLeak] HTTP server closed.');
    process.exit(0);
  });
});
