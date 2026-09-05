import { Module } from '@nestjs/common';
import { WebAnalyticsController } from './web-analytics.controller';
import { WebAnalyticsService } from './web-analytics.service';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [WebAnalyticsController],
  providers: [WebAnalyticsService],
})
export class WebAnalyticsModule {}
