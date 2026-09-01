import { Global, Module } from '@nestjs/common';
import { ConfigService } from './config.service';

export { ConfigService } from './config.service';

/**
 * Drop-in replacement for `@nestjs/config`'s `ConfigModule.forRoot({
 * isGlobal: true, load: [configuration], validationSchema })`. See
 * `config.service.ts` for why: the real package is ESM-only and crashes
 * with `ERR_REQUIRE_ESM` on Vercel's serverless runtime.
 */
@Global()
@Module({
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
