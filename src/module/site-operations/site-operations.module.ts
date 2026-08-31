import { Module } from '@nestjs/common';
import { SiteOperationsService } from './site-operations.service';
import { SiteOperationsController } from './site-operations.controller';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [SiteOperationsController],
  providers: [SiteOperationsService],
  exports: [SiteOperationsService],
})
export class SiteOperationsModule {}
