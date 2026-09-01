import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';
import { BranchScopeQueryDto } from '../../../common/dto/branch-scope.dto';

/** Query params for GET erp/sales/revenue-summary */
export class RevenueSummaryQueryDto extends BranchScopeQueryDto {
  @ApiPropertyOptional({ description: 'Inclusive lower bound on soldAt' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ description: 'Inclusive upper bound on soldAt' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}

/** Query params for GET erp/sales/monthly-revenue */
export class MonthlyRevenueQueryDto extends BranchScopeQueryDto {
  @ApiPropertyOptional({
    description: 'How many past calendar months to return (default 12)',
    default: 12,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(60)
  months?: number;
}
