import { Module } from '@nestjs/common';
import { VisitorsService } from './visitors.service';
import { VisitorsController } from './visitors.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [OrganizationsModule, BranchesModule],
  controllers: [VisitorsController],
  providers: [VisitorsService],
  exports: [VisitorsService],
})
export class VisitorsModule {}
