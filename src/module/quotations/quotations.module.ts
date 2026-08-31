import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QuotationsService } from './quotations.service';
import { QuotationsController } from './quotations.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { QUEUE_NAMES } from '../../lib/queue/queue.constants';

@Module({
  imports: [
    OrganizationsModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.PDF }),
  ],
  controllers: [QuotationsController],
  providers: [QuotationsService],
  exports: [QuotationsService],
})
export class QuotationsModule {}
