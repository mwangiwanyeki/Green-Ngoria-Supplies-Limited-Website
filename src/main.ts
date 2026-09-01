import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from './config/config.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import type { Express } from 'express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    // Disable default NestJS logger — nestjs-pino takes over
    bufferLogs: true,
  });

  // Use Pino structured logger
  app.useLogger(app.get(Logger));

  // ── Trust the load balancer/reverse proxy in front of us ─────────────────
  // Without this, req.ip (and rate limiting keyed on it) reflects the proxy's
  // address rather than the real client's.
  (app.getHttpAdapter().getInstance() as Express).set('trust proxy', 1);

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 3000;
  const nodeEnv = config.get<string>('nodeEnv') ?? 'development';
  const corsOrigins = config.get<string[]>('urls.corsOrigins') ?? [
    'http://localhost:3000',
  ];

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: nodeEnv === 'production',
      crossOriginEmbedderPolicy: nodeEnv === 'production',
    }),
  );

  // ── CORS — strict allowlist, never wildcard in production ─────────────────
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (mobile apps, curl, Postman in dev)
      if (!origin && nodeEnv !== 'production') {
        return callback(null, true);
      }
      if (!origin || corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(
        new Error(`CORS policy: origin ${origin} is not allowed`),
      );
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Org-ID',
      'X-Branch-Id',
    ],
    exposedHeaders: ['X-Request-ID'],
    credentials: true,
    maxAge: 86400, // 24 hours pre-flight cache
  });

  // ── Compression ───────────────────────────────────────────────────────────
  app.use(compression());

  // ── Cookie parser ─────────────────────────────────────────────────────────
  app.use(cookieParser(config.get<string>('auth.sessionSecret')));

  // ── API global prefix + versioning ───────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ── Global validation pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip undeclared properties
      forbidNonWhitelisted: true, // Reject requests with undeclared properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
      stopAtFirstError: false, // Collect all validation errors
    }),
  );

  // ── Global exception filter ───────────────────────────────────────────────
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Swagger API documentation ─────────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Green Ngoria Supplies Limited — API')
      .setDescription(
        `Enterprise Mining & Mining-Plant Operations Platform API.
        
Primary business: Mining, mineral processing, engineering and construction of mining plants 
with particular expertise in gold-processing facilities (CIP/CIL systems).

**Base URL:** /api/v1

All protected endpoints require a Bearer token obtained from POST /api/v1/auth/login.`,
      )
      .setVersion('1.0')
      .setContact(
        'Green Ngoria Supplies Limited',
        'https://greenngoria.com',
        'api@greenngoria.com',
      )
      .setLicense('Proprietary', '')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token obtained from /auth/login',
        },
        'access-token',
      )
      .addTag('Authentication', 'Login, registration, password management, MFA')
      .addTag('Users', 'User management and RBAC')
      .addTag('Organizations', 'Organization and membership management')
      .addTag('Health', 'Service health checks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'none',
        filter: true,
        showExtensions: true,
      },
      customSiteTitle: 'Green Ngoria API Docs',
    });
  }

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  app.enableShutdownHooks();

  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`🚀 Green Ngoria API running on port ${port} [${nodeEnv}]`);
  logger.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🏥 Health check: http://localhost:${port}/health`);
}

bootstrap().catch((err) => {
  console.error('Fatal error during bootstrap:', err);
  process.exit(1);
});
