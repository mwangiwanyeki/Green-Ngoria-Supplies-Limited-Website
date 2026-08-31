import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationsService } from './notifications.service';
import { QUEUE_NAMES } from '../queue/queue.constants';

const redisEnabled = process.env.REDIS_ENABLED !== 'false';

@Global()
@Module({
  imports: redisEnabled
    ? [BullModule.registerQueue({ name: QUEUE_NAMES.NOTIFICATIONS })]
    : [],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
