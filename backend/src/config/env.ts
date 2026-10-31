import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),

  // Neon PostgreSQL Database URLs
  DATABASE_URL: z.string().default('postgresql://neondb_owner:placeholder@localhost:5432/neondb'),
  DIRECT_DATABASE_URL: z.string().optional(),

  // Google Gemini API Key and Model configuration
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GEMINI_TIMEOUT_MS: z.coerce.number().default(60000),

  // Internal Python FastAPI Presidio Service
  PRESIDIO_SERVICE_URL: z.string().default('http://localhost:8000'),
  INTERNAL_SERVICE_TOKEN: z.string().default('zeroleak_dev_internal_token_secure_sandbox'),

  // Authentication & Security Secrets
  JWT_SECRET: z.string().default('zeroleak_jwt_signing_secret_min_32_characters_random_local_dev'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // File Storage & Limits
  MAX_UPLOAD_MB: z.coerce.number().default(15),
  UPLOAD_TEMP_DIR: z.string().default('./temp_uploads'),
  SANITIZED_DIR: z.string().default('./temp_sanitized'),

  // ZeroLeak Policy & Lifecycles
  MAPPING_TTL_SECONDS: z.coerce.number().default(300),
  HISTORY_ENABLED: z.coerce.boolean().default(true),
  FAIL_CLOSED: z.coerce.boolean().default(true),
  RATE_LIMIT_MAX_PER_MINUTE: z.coerce.number().default(120),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[ZeroLeak Config] Invalid environment configuration:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
