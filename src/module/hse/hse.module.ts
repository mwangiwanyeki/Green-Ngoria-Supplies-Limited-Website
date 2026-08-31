import { Module } from '@nestjs/common';
import { HseService } from './hse.service';
import { HseController } from './hse.controller';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [OrganizationsModule],
  controllers: [HseController],
  providers: [HseService],
  exports: [HseService],
})
export class HseModule {}
