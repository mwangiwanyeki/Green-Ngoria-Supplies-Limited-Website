import { Global, Module } from '@nestjs/common';
import { ArcjetService } from './arcjet.service';
import { ArcjetGuard } from './arcjet.guard';

/**
 * Global module exposing the Arcjet service + guard. Global so the guard can
 * be registered app-wide via APP_GUARD in AppModule without re-importing.
 */
@Global()
@Module({
  providers: [ArcjetService, ArcjetGuard],
  exports: [ArcjetService, ArcjetGuard],
})
export class ArcjetModule {}
