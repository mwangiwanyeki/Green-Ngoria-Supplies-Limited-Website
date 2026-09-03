import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  ForbiddenException,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ArcjetService } from './arcjet.service';

/**
 * Mark a route/controller to use the sharper auth-tier Arcjet rules
 * (token-bucket rate limit + stricter bot policy). Without it, the guard
 * applies only the baseline shield + bot detection.
 */
export const ARCJET_AUTH = 'arcjet:auth';
export const ArcjetAuth = () => SetMetadata(ARCJET_AUTH, true);

/**
 * Skip Arcjet entirely for a route (e.g. health checks, webhooks that must
 * never be rate limited).
 */
export const ARCJET_SKIP = 'arcjet:skip';
export const ArcjetSkip = () => SetMetadata(ARCJET_SKIP, true);

@Injectable()
export class ArcjetGuard implements CanActivate {
  private readonly logger = new Logger(ArcjetGuard.name);

  constructor(
    private readonly arcjet: ArcjetService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!this.arcjet.isEnabled) return true;

    const skip = this.reflector.getAllAndOverride<boolean>(ARCJET_SKIP, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const isAuth = this.reflector.getAllAndOverride<boolean>(ARCJET_AUTH, [
      context.getHandler(),
      context.getClass(),
    ]);

    const decision = isAuth
      ? await this.arcjet.protectAuth(request)
      : await this.arcjet.protect(request);

    // Disabled or no decision → allow (fail-open: Arcjet must never take the
    // whole API down if it can't reach its service).
    if (!decision) return true;

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        this.logger.warn(`Arcjet rate limit: ${request.ip} ${request.path}`);
        throw new HttpException(
          'Too many requests — please slow down and try again shortly.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (decision.reason.isBot()) {
        this.logger.warn(`Arcjet bot blocked: ${request.ip} ${request.path}`);
        throw new ForbiddenException('Automated access is not permitted.');
      }
      this.logger.warn(
        `Arcjet denied (${decision.reason.type}): ${request.ip} ${request.path}`,
      );
      throw new ForbiddenException('Request blocked by security policy.');
    }

    return true;
  }
}
