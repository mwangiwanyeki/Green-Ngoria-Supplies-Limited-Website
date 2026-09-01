import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().default(3000),

  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().optional(),

  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_ENABLED: Joi.string().valid('true', 'false').optional(),

  JWT_SECRET: Joi.string().min(64).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(64).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  SESSION_SECRET: Joi.string().min(64).required(),
  COOKIE_DOMAIN: Joi.string().optional(),

  FRONTEND_URL: Joi.string().uri().default('http://localhost:4000'),
  CLIENT_PORTAL_URL: Joi.string().uri().default('http://localhost:4001'),
  ADMIN_URL: Joi.string().uri().default('http://localhost:4002'),
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  API_URL: Joi.string().uri().optional(),

  // ── Mail ────────────────────────────────────────────────────────────────
  MAIL_PROVIDER: Joi.string().optional(),
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().default(587),
  MAIL_SECURE: Joi.string().valid('true', 'false').optional(),
  MAIL_USER: Joi.string().optional(),
  MAIL_PASSWORD: Joi.string().optional(),
  MAIL_FROM: Joi.string().optional(),
  RESEND_API_KEY: Joi.string().optional(),
  MAIL_QUEUE_ATTEMPTS: Joi.number().default(3),
  MAIL_QUEUE_BACKOFF_DELAY: Joi.number().default(5000),

  // ── Supabase ────────────────────────────────────────────────────────────
  SUPABASE_URL: Joi.string().uri().optional(),
  SUPABASE_ANON_KEY: Joi.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().optional(),

  // ── Storage (local / S3-compatible) ────────────────────────────────────
  STORAGE_PROVIDER: Joi.string()
    .valid('local', 's3', 'supabase')
    .default('local'),
  STORAGE_BUCKET: Joi.string().optional(),
  STORAGE_LOCAL_PATH: Joi.string().optional(),
  STORAGE_SIGNED_URL_EXPIRES: Joi.number().default(3600),
  S3_ACCESS_KEY_ID: Joi.string().optional(),
  S3_SECRET_ACCESS_KEY: Joi.string().optional(),
  S3_ENDPOINT: Joi.string().uri().optional(),
  S3_BUCKET: Joi.string().optional(),
  S3_REGION: Joi.string().default('us-east-1'),

  // ── Auth / MFA ──────────────────────────────────────────────────────────
  MFA_ISSUER: Joi.string().optional(),
  AUTH_MAX_FAILED_ATTEMPTS: Joi.number().default(5),
  AUTH_LOCKOUT_DURATION_MINUTES: Joi.number().default(30),

  // ── Rate limiting ───────────────────────────────────────────────────────
  THROTTLE_TTL_SECONDS: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(100),
  AUTH_THROTTLE_TTL_SECONDS: Joi.number().default(60),
  AUTH_THROTTLE_LIMIT: Joi.number().default(10),

  // ── Uploads ─────────────────────────────────────────────────────────────
  UPLOAD_MAX_FILE_SIZE: Joi.number().default(52428800),
  UPLOAD_ALLOWED_MIME_TYPES: Joi.string().optional(),

  // ── Monitoring / logging ───────────────────────────────────────────────
  SENTRY_DSN: Joi.string().uri().optional(),
  LOG_LEVEL: Joi.string()
    .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
    .default('debug'),
  OTEL_EXPORTER_OTLP_ENDPOINT: Joi.string().uri().optional(),
  OTEL_SERVICE_NAME: Joi.string().optional(),

  // ── Feature flags ───────────────────────────────────────────────────────
  FEATURE_MFA_ENABLED: Joi.string().valid('true', 'false').optional(),
  FEATURE_EMAIL_VERIFICATION_REQUIRED: Joi.string()
    .valid('true', 'false')
    .optional(),
  FEATURE_MAINTENANCE_MODE: Joi.string().valid('true', 'false').optional(),

  // ── PDF generation ─────────────────────────────────────────────────────
  PDF_QUEUE_ATTEMPTS: Joi.number().optional(),
  PDF_QUEUE_BACKOFF_DELAY: Joi.number().optional(),

  // ── Encryption (required — AES-256 key material) ──────────────────────
  ENCRYPTION_KEY: Joi.string().min(32).required(),
}).options({ allowUnknown: true });
