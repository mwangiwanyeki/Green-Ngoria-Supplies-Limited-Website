import { Module } from '@nestjs/common';
import { MiningSitesService } from './mining-sites.service';
import { MiningSitesController } from './mining-sites.controller';

@Module({
  controllers: [MiningSitesController],
  providers: [MiningSitesService],
  exports: [MiningSitesService],
})
export class MiningSitesModule {}
