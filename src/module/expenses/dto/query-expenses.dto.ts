import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsOptional, IsUUID } from 'class-validator';
import { BranchScopedPaginationDto } from '../../../common/dto/branch-scope.dto';

export class QueryExpensesDto extends BranchScopedPaginationDto {
  @ApiPropertyOptional({ description: 'Restrict to one category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Restrict to one financial account' })
  @IsOptional()
  @IsUUID()
  accountId?: string;

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
