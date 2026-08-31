import { Module } from '@nestjs/common';
import { VatLeachService } from './vat-leach.service';
import { VatLeachController } from './vat-leach.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [OrganizationsModule, BranchesModule],
  controllers: [VatLeachController],
  providers: [VatLeachService],
  exports: [VatLeachService],
})
export class VatLeachModule {}
