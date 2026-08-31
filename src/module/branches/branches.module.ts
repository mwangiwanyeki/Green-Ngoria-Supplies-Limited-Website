import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { OrganizationsModule } from '../organizations/organizations.module';

/**
 * Branch CRUD plus the per-branch Settings screen.
 *
 * `BranchesService` is exported because it carries
 * `assertBranchInOrganization()` — the anti-IDOR primitive every other ERP
 * module uses to validate a caller-supplied `branchId`.
 */
@Module({
  imports: [OrganizationsModule],
  controllers: [BranchesController],
  providers: [BranchesService],
  exports: [BranchesService],
})
export class BranchesModule {}
