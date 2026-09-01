import { Injectable } from '@nestjs/common';
import configuration from './configuration';
import { validationSchema } from './validation.schema';

/**
 * Drop-in replacement for `@nestjs/config`'s `ConfigService`.
 *
 * `@nestjs/config@12` ships as an ESM-only package (`"type": "module"`,
 * no `require` export condition), which crashes at runtime in any
 * CommonJS-compiled deployment target with `ERR_REQUIRE_ESM` (confirmed on
 * Vercel's Node.js serverless runtime — ordinary local `nest start`/`nest
 * build` never exercises this path the same way, so it looked fine
 * locally). This class reproduces the same `get<T>(path)` dot-notation
 * lookup against the same `configuration()` factory and Joi
 * `validationSchema`, so every existing `ConfigService` call site and every
 * `inject: [ConfigService]` factory keeps working unchanged — only the
 * import specifier changes, from `'@nestjs/config'` to this file.
 */
@Injectable()
export class ConfigService {
  private readonly values: Record<string, unknown>;

  constructor() {
    const { error, value } = validationSchema.validate(process.env, {
      allowUnknown: true,
      abortEarly: false,
    });
    if (error) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    // Joi may coerce/default values (e.g. numeric strings, defaults) onto a
    // clone of process.env; mirror those back so configuration() — which
    // reads directly from process.env — picks them up exactly as
    // @nestjs/config's ConfigModule.forRoot({ validationSchema }) does.
    Object.assign(process.env, value);
    this.values = configuration();
  }

  get<T = unknown>(path: string): T {
    const parts = path.split('.');
    let current: unknown = this.values;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') return undefined as T;
      current = (current as Record<string, unknown>)[part];
    }
    return current as T;
  }
}
