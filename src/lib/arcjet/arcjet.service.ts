import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config/config.module';
import arcjet, {
  shield,
  detectBot,
  tokenBucket,
  type ArcjetNode,
  type ArcjetDecision,
} from '@arcjet/node';

/**
 * Arcjet wrapper — application-layer defence that sits IN FRONT of the
 * existing auth + throttler stack:
 *
 *  - shield()      → WAF: blocks SQLi / common attack payloads.
 *  - detectBot()   → blocks automated clients except well-known good bots
 *                    (search engines, previews, uptime monitors).
 *  - tokenBucket() → a second, sharper rate limit specifically for the
 *                    sensitive auth endpoints, on top of @nestjs/throttler.
 *
 * When ARCJET_KEY is unset the service is inert (`isEnabled === false`) and
 * every protect() call returns undefined, so local dev and any environment
 * without the key behaves exactly as before.
 */
@Injectable()
export class ArcjetService implements OnModuleInit {
  private readonly logger = new Logger(ArcjetService.name);
  // Base client has no rule-required props; the auth client's tokenBucket
  // requires `requested`.
  private client: ArcjetNode<Record<never, never>> | null = null;
  private authClient: ArcjetNode<{ requested: number }> | null = null;

  constructor(private readonly config: ConfigService) {}

  get isEnabled(): boolean {
    return this.client !== null;
  }

  onModuleInit(): void {
    const key = this.config.get<string>('arcjet.key');
    const mode =
      this.config.get<'LIVE' | 'DRY_RUN'>('arcjet.mode') ?? 'DRY_RUN';

    if (!key) {
      this.logger.warn(
        'ARCJET_KEY not set — Arcjet protection is disabled (requests pass through to the existing throttler/auth only).',
      );
      return;
    }

    // Baseline protection applied to every route the guard covers.
    this.client = arcjet({
      key,
      characteristics: ['ip.src'],
      rules: [
        shield({ mode }),
        detectBot({
          mode,
          // Allow legitimate automated traffic; block the rest.
          allow: [
            'CATEGORY:SEARCH_ENGINE',
            'CATEGORY:MONITOR',
            'CATEGORY:PREVIEW',
          ],
        }),
      ],
    });

    // Sharper limit for auth endpoints — 10 requests / 10s burst, refill 5/10s.
    this.authClient = arcjet({
      key,
      characteristics: ['ip.src'],
      rules: [
        shield({ mode }),
        detectBot({
          mode,
          allow: ['CATEGORY:MONITOR', 'CATEGORY:PREVIEW'],
        }),
        tokenBucket({
          mode,
          refillRate: 5,
          interval: 10,
          capacity: 10,
        }),
      ],
    });

    this.logger.log(`Arcjet protection enabled (mode=${mode}).`);
  }

  /** Protect a general route. Returns undefined when Arcjet is disabled. */
  async protect(request: unknown): Promise<ArcjetDecision | undefined> {
    if (!this.client) return undefined;
    return this.client.protect(request as never, {});
  }

  /**
   * Protect a sensitive auth route with the token-bucket limiter. `cost` is
   * how many tokens this request consumes (default 1).
   */
  async protectAuth(
    request: unknown,
    cost = 1,
  ): Promise<ArcjetDecision | undefined> {
    if (!this.authClient) return undefined;
    return this.authClient.protect(request as never, { requested: cost });
  }
}
