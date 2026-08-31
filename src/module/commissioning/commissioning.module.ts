import { Module } from '@nestjs/common';
import { CommissioningService } from './commissioning.service';
import { CommissioningController } from './commissioning.controller';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [CommissioningController],
  providers: [CommissioningService],
  exports: [CommissioningService],
})
export class CommissioningModule {}
