import { Module } from '@nestjs/common';
import { StockPilesService } from './stock-piles.service';
import { StockPilesController } from './stock-piles.controller';
import { OrganizationsModule } from '../organizations/organizations.module';
import { BranchesModule } from '../branches/branches.module';

@Module({
  imports: [OrganizationsModule, BranchesModule],
  controllers: [StockPilesController],
  providers: [StockPilesService],
  exports: [StockPilesService],
})
export class StockPilesModule {}
