import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { DebtAccountStatus } from '@prisma/client';
import { BranchScopedPaginationDto } from '../../../common/dto/branch-scope.dto';

export class QueryDebtAccountsDto extends BranchScopedPaginationDto {
  @ApiPropertyOptional({
    enum: DebtAccountStatus,
    description:
      'Filter by status. OVERDUE also matches accounts whose due date has ' +
      'passed while still carrying a balance.',
  })
  @IsOptional()
  @IsEnum(DebtAccountStatus)
  status?: DebtAccountStatus;
}
