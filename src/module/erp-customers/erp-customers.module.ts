import { Module } from '@nestjs/common';
import { ErpCustomersService } from './erp-customers.service';
import { ErpCustomersController } from './erp-customers.controller';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [ErpCustomersController],
  providers: [ErpCustomersService],
  exports: [ErpCustomersService],
})
export class ErpCustomersModule {}
