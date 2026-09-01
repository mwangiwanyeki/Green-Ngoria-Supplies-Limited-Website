import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { QUEUE_NAMES } from '../../lib/queue/queue.constants';

// Match the same feature-flag QueueModule and NotificationsModule use: only
// register the Bull queue when Redis is actually available. Otherwise BullMQ
// tries to connect to redis://localhost:6379 on boot and crashes the process.
// The service's `pdfQueue` is `@Optional()` and typed `Queue | null`, so a
// null queue is handled fine at the call sites.
const redisEnabled = process.env.REDIS_ENABLED !== 'false';

@Module({
  imports: [
    OrganizationsModule,
    ...(redisEnabled
      ? [BullModule.registerQueue({ name: QUEUE_NAMES.PDF })]
      : []),
  ],
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
