export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  urls: {
    api: process.env.API_URL ?? 'http://localhost:3000',
    frontend: process.env.FRONTEND_URL ?? 'http://localhost:4000',
    clientPortal: process.env.CLIENT_PORTAL_URL ?? 'http://localhost:4001',
    admin: process.env.ADMIN_URL ?? 'http://localhost:4002',
    corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim()),
  },

  database: {
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  },

  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD ?? undefined,
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    sessionSecret: process.env.SESSION_SECRET,
    cookieDomain: process.env.COOKIE_DOMAIN,
    mfaIssuer: process.env.MFA_ISSUER ?? 'GreenNgoria',
    maxFailedAttempts: parseInt(
      process.env.AUTH_MAX_FAILED_ATTEMPTS ?? '5',
      10,
    ),
    lockoutDurationMinutes: parseInt(
      process.env.AUTH_LOCKOUT_DURATION_MINUTES ?? '30',
      10,
    ),
  },

  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // Arcjet — application-layer security (WAF shield, bot detection, rate
  // limiting). Layered ON TOP of the existing @nestjs/throttler + custom
  // lockout, not a replacement. Disabled automatically when no key is set,
  // so local dev without a key still works.
  arcjet: {
    key: process.env.ARCJET_KEY,
    // In dev, Arcjet runs in DRY_RUN so it logs decisions without blocking;
    // in production it enforces (LIVE).
    mode:
      (process.env.ARCJET_MODE ??
        (process.env.NODE_ENV === 'production' ? 'LIVE' : 'DRY_RUN')) as
        | 'LIVE'
        | 'DRY_RUN',
  },

  storage: {
    provider: process.env.STORAGE_PROVIDER ?? 'local',
    bucket: process.env.STORAGE_BUCKET ?? 'greenngoria-documents',
    localPath: process.env.STORAGE_LOCAL_PATH ?? './storage',
    signedUrlExpires: parseInt(
      process.env.STORAGE_SIGNED_URL_EXPIRES ?? '3600',
      10,
    ),
    s3: {
      region: process.env.S3_REGION ?? 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      endpoint: process.env.S3_ENDPOINT,
      bucket: process.env.S3_BUCKET,
    },
  },

  mail: {
    provider: process.env.MAIL_PROVIDER ?? 'smtp',
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER,
    password: process.env.MAIL_PASSWORD,
    from:
      process.env.MAIL_FROM ??
      'Green Ngoria Supplies Limited <noreply@greenngoria.com>',
    resendApiKey: process.env.RESEND_API_KEY,
    queueAttempts: parseInt(process.env.MAIL_QUEUE_ATTEMPTS ?? '3', 10),
    queueBackoffDelay: parseInt(
      process.env.MAIL_QUEUE_BACKOFF_DELAY ?? '5000',
      10,
    ),
  },

  company: {
    // Internal inboxes that receive a copy of every public-site enquiry.
    // info@greenngoria.com must receive every submission (hard requirement).
    supportEmail: process.env.SUPPORT_EMAIL ?? 'info@greenngoria.com',
    customerCareEmail:
      process.env.CUSTOMER_CARE_EMAIL ?? 'customercare@greenngoria.com',
    // The public marketing organisation these enquiries are filed under.
    orgSlug: process.env.PUBLIC_ORG_SLUG ?? 'green-ngoria',
  },

  throttle: {
    ttlSeconds: parseInt(process.env.THROTTLE_TTL_SECONDS ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
    authTtlSeconds: parseInt(process.env.AUTH_THROTTLE_TTL_SECONDS ?? '60', 10),
    authLimit: parseInt(process.env.AUTH_THROTTLE_LIMIT ?? '10', 10),
  },

  upload: {
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE ?? '52428800', 10),
    allowedMimeTypes: (
      process.env.UPLOAD_ALLOWED_MIME_TYPES ??
      'application/pdf,image/jpeg,image/png,image/webp'
    ).split(','),
  },

  monitoring: {
    sentryDsn: process.env.SENTRY_DSN,
    logLevel: process.env.LOG_LEVEL ?? 'debug',
  },

  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },

  features: {
    mfaEnabled: process.env.FEATURE_MFA_ENABLED !== 'false',
    emailVerificationRequired:
      process.env.FEATURE_EMAIL_VERIFICATION_REQUIRED !== 'false',
    maintenanceMode: process.env.FEATURE_MAINTENANCE_MODE === 'true',
  },
});
