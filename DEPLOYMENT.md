# Green Ngoria — Deployment Guide

## Environments

| Environment | API URL                               | Notes                            |
| ----------- | ------------------------------------- | -------------------------------- |
| Development | `http://localhost:3000`               | Local with `.env`                |
| Staging     | `https://staging-api.greenngoria.com` | Mirrors production data shape    |
| Production  | `https://api.greenngoria.com`         | Supabase PostgreSQL, Redis Cloud |

## Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (or Supabase project)
- Redis 7+

## Local development

```bash
# 1. Clone and install
pnpm install

# 2. Copy env file and fill in values
cp .env.example .env

# 3. Run database migrations
pnpm prisma migrate dev

# 4. Seed development data
pnpm prisma db seed

# 5. Start dev server
pnpm start:dev
```

API available at: `http://localhost:3000`  
Swagger docs: `http://localhost:3000/api/docs`

## Production build

```bash
pnpm build
node dist/main
```

## Docker

```bash
# Build image
docker build -t greenngoria-api .

# Run with environment
docker run -p 3000:3000 --env-file .env greenngoria-api
```

## Database migrations (production)

```bash
# NEVER run migrate dev in production
pnpm prisma migrate deploy
```

## Environment variables

See `.env.example` for the full reference.

Required in all environments:

```
DATABASE_URL
JWT_SECRET           (min 32 chars)
JWT_REFRESH_SECRET   (min 32 chars, different from JWT_SECRET)
SESSION_SECRET       (min 32 chars)
```

## Health check endpoints

```
GET /health       — Full health (DB + memory)
GET /health/live  — Liveness (process alive)
GET /health/ready — Readiness (DB connected)
```

Configure your load balancer/K8s readiness probe to use `/health/ready`.

## CI/CD (GitHub Actions)

Recommended pipeline:

1. `pnpm install`
2. `pnpm lint`
3. `pnpm tsc --noEmit`
4. `pnpm test`
5. `pnpm build`
6. `pnpm prisma migrate deploy` (staging/production only)
7. Deploy Docker image

## Scaling notes

- The app is stateless — scale horizontally with multiple instances
- BullMQ workers can run as separate processes if queue load is high
- Redis is required for queue persistence across instances
- File storage should use S3/Supabase Storage (not local) in production
