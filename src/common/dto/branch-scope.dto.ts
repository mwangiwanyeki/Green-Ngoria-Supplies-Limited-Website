import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { PaginationDto } from './pagination.dto';

/**
 * Query DTO for a read endpoint scoped to a single ERP branch.
 * `branchId` is REQUIRED and is always re-verified against the caller's
 * organization by the service before it reaches a `where` clause.
 */
export class BranchScopeQueryDto {
  @ApiProperty({ description: 'Branch the request is scoped to' })
  @IsUUID()
  branchId: string;
}

/** Paginated list query scoped to a single ERP branch. */
export class BranchScopedPaginationDto extends PaginationDto {
  @ApiProperty({ description: 'Branch the request is scoped to' })
  @IsUUID()
  branchId: string;
}
