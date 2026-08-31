import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PlantAssessmentsService } from './plant-assessments.service';
import { PlantAssessmentsController } from './plant-assessments.controller';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    OrganizationsModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [PlantAssessmentsController],
  providers: [PlantAssessmentsService],
  exports: [PlantAssessmentsService],
})
export class PlantAssessmentsModule {}
