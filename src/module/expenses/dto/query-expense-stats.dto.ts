import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { BranchScopeQueryDto } from '../../../common/dto/branch-scope.dto';

export class QueryExpenseStatsDto extends BranchScopeQueryDto {
  @ApiPropertyOptional({ description: 'Inclusive lower bound on incurredAt' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ description: 'Inclusive upper bound on incurredAt' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
