import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '../../config/config.module';
// Types only — erased at compile time, so no runtime `require` of the
// ESM-only @arcjet/node package (which would throw ERR_REQUIRE_ESM in the
// CommonJS serverless bundle). The runtime value import is dynamic, below.
import type { ArcjetNode, ArcjetDecision } from '@arcjet/node';

// tsc with `module: commonjs` rewrites a literal `import()` into `require()`,
// which throws ERR_REQUIRE_ESM for an ESM-only package. Wrapping it in
// `new Function` hides the call from the compiler so a genuine dynamic ESM
// import survives to runtime.
const esmImport = new Function(
  'specifier',
  'return import(specifier);',
) as (specifier: string) => Promise<typeof import('@arcjet/node')>;

/**
 * Arcjet wrapper — application-layer defence in front of the existing auth +
 * throttler stack (WAF shield, bot detection, and a sharper token-bucket rate
 * limit for auth endpoints).
 *
 * Two hard requirements shaped this implementation:
 *
 *  1. `@arcjet/node` is ESM-only. The backend compiles to CommonJS, so a
 *     static `import`/`require` throws ERR_REQUIRE_ESM at load and crashes
 *     the whole app on Vercel. We therefore load it with a dynamic `import()`
 *     at runtime (allowed from CJS).
 *  2. Arcjet must never take the API down. Every load/protect path is wrapped
 *     so any failure leaves the service disabled and requests pass straight
 *     through to the existing throttler/auth (fail-open).
 *
 * When ARCJET_KEY is unset the service is inert and every protect() returns
 * undefined, so local dev and any keyless environment behaves as before.
 */
@Injectable()
export class ArcjetService implements OnModuleInit {
  private readonly logger = new Logger(ArcjetService.name);
  private client: ArcjetNode<Record<never, never>> | null = null;
  private authClient: ArcjetNode<{ requested: number }> | null = null;

  constructor(private readonly config: ConfigService) {}

  get isEnabled(): boolean {
    return this.client !== null;
  }

  async onModuleInit(): Promise<void> {
    const key = this.config.get<string>('arcjet.key');
    const mode =
      this.config.get<'LIVE' | 'DRY_RUN'>('arcjet.mode') ?? 'DRY_RUN';

    if (!key) {
      this.logger.warn(
        'ARCJET_KEY not set — Arcjet protection disabled (requests fall through to the existing throttler/auth only).',
      );
      return;
    }

    try {
      // Dynamic import of the ESM package from this CJS module.
      const aj = await esmImport('@arcjet/node');
      const arcjet = aj.default;
      const { shield, detectBot, tokenBucket } = aj;

      this.client = arcjet({
        key,
        characteristics: ['ip.src'],
        rules: [
          shield({ mode }),
          detectBot({
            mode,
            allow: [
              'CATEGORY:SEARCH_ENGINE',
              'CATEGORY:MONITOR',
              'CATEGORY:PREVIEW',
            ],
          }),
        ],
      }) as unknown as ArcjetNode<Record<never, never>>;

      this.authClient = arcjet({
        key,
        characteristics: ['ip.src'],
        rules: [
          shield({ mode }),
          detectBot({ mode, allow: ['CATEGORY:MONITOR', 'CATEGORY:PREVIEW'] }),
          tokenBucket({ mode, refillRate: 5, interval: 10, capacity: 10 }),
        ],
      }) as unknown as ArcjetNode<{ requested: number }>;

      this.logger.log(`Arcjet protection enabled (mode=${mode}).`);
    } catch (err) {
      // Never crash the app because Arcjet couldn't load — just stay disabled.
      this.client = null;
      this.authClient = null;
      this.logger.error(
        `Arcjet failed to initialise — protection disabled, continuing without it: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /** Protect a general route. Returns undefined when Arcjet is disabled. */
  async protect(request: unknown): Promise<ArcjetDecision | undefined> {
    if (!this.client) return undefined;
    try {
      return await this.client.protect(request as never, {});
    } catch (err) {
      this.logger.warn(
        `Arcjet protect() errored — allowing request: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return undefined;
    }
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
    try {
      return await this.authClient.protect(request as never, {
        requested: cost,
      });
    } catch (err) {
      this.logger.warn(
        `Arcjet protectAuth() errored — allowing request: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return undefined;
    }
  }
}
