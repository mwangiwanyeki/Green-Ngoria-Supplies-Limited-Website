import { Module } from '@nestjs/common';
import { SiteSecurityService } from './site-security.service';
import { SiteSecurityController } from './site-security.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [OrganizationsModule, BranchesModule],
  controllers: [SiteSecurityController],
  providers: [SiteSecurityService],
  exports: [SiteSecurityService],
})
export class SiteSecurityModule {}
