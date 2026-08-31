import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsOptional } from 'class-validator';
import { AccountTransactionType } from '@prisma/client';
import { BranchScopedPaginationDto } from '../../../common/dto/branch-scope.dto';

export class QueryAccountTransactionsDto extends BranchScopedPaginationDto {
  @ApiPropertyOptional({ enum: AccountTransactionType })
  @IsOptional()
  @IsEnum(AccountTransactionType)
  type?: AccountTransactionType;

  @ApiPropertyOptional({ description: 'Only manual ledger entries' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isManualEntry?: boolean;

  @ApiPropertyOptional({ description: 'Inclusive lower bound on occurredAt' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @ApiPropertyOptional({ description: 'Inclusive upper bound on occurredAt' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
