import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';

/**
 * NotificationsApiModule — exposes the REST controller for /notifications endpoints.
 * The NotificationsService is provided globally by lib/notifications/notifications.module.ts.
 */
@Module({
  controllers: [NotificationsController],
})
export class NotificationsApiModule {}
