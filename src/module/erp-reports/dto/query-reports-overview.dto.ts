import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { BranchScopeQueryDto } from '../../../common/dto/branch-scope.dto';

/** Preset reporting windows offered by the admin reports screen. */
export enum ReportRange {
  TODAY = 'today',
  YESTERDAY = 'yesterday',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom',
}

export class QueryReportsOverviewDto extends BranchScopeQueryDto {
  @ApiPropertyOptional({
    enum: ReportRange,
    default: ReportRange.MONTH,
    description: 'Preset reporting window. Defaults to the current month.',
  })
  @IsOptional()
  @IsEnum(ReportRange)
  range?: ReportRange;

  @ApiPropertyOptional({
    description: 'Inclusive lower bound. Required when range=custom.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({
    description: 'Inclusive upper bound. Required when range=custom.',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 24,
    default: 12,
    description: 'How many trailing months the revenue/expense trend covers.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  months?: number;
}
