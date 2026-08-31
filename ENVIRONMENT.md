# Green Ngoria — Environment Variables Reference

See `.env.example` for the complete file with comments.

## Required (all environments)

| Variable             | Description                                              |
| -------------------- | -------------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL connection string (pooled)                    |
| `JWT_SECRET`         | JWT signing secret (min 32 chars)                        |
| `JWT_REFRESH_SECRET` | Refresh token signing secret (different from JWT_SECRET) |
| `SESSION_SECRET`     | Cookie/session signing secret                            |

## Required (production)

| Variable                        | Description                                            |
| ------------------------------- | ------------------------------------------------------ |
| `DIRECT_URL`                    | Direct PostgreSQL URL (bypasses pooler for migrations) |
| `REDIS_URL`                     | Redis connection URL                                   |
| `MAIL_HOST` or `RESEND_API_KEY` | Email delivery                                         |
| `CORS_ORIGINS`                  | Comma-separated list of allowed origins                |
| `SENTRY_DSN`                    | Error monitoring                                       |
| `ENCRYPTION_KEY`                | 32-byte hex key for field encryption                   |

## Feature flags

| Variable                              | Default | Description                                |
| ------------------------------------- | ------- | ------------------------------------------ |
| `FEATURE_MFA_ENABLED`                 | `true`  | Enable MFA setup and enforcement           |
| `FEATURE_EMAIL_VERIFICATION_REQUIRED` | `true`  | Require email verification before login    |
| `FEATURE_MAINTENANCE_MODE`            | `false` | Put platform in read-only maintenance mode |

## Storage providers

Set `STORAGE_PROVIDER` to one of:

| Value      | Description                                            |
| ---------- | ------------------------------------------------------ |
| `local`    | Local filesystem (development only)                    |
| `s3`       | S3-compatible (AWS S3, MinIO, Supabase Storage S3 API) |
| `supabase` | Supabase Storage (uses service role key)               |

## Security notes

- Never commit `.env` to version control
- Use a secrets manager (AWS Secrets Manager, Doppler, etc.) in production
- `JWT_SECRET` and `JWT_REFRESH_SECRET` must be different values
- Rotate all secrets if a breach is suspected
- `ENCRYPTION_KEY` loss means encrypted field data is unrecoverable
