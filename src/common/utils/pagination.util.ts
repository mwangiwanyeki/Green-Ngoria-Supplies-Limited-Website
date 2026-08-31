import { PaginationDto } from '../dto/pagination.dto';

export interface PaginationResult {
  skip: number;
  take: number;
  orderBy: Record<string, 'asc' | 'desc'>;
}

export function buildPagination(
  dto: PaginationDto,
  defaultSortBy = 'createdAt',
): PaginationResult {
  const page = dto.page ?? 1;
  const limit = dto.limit ?? 20;
  const sortBy = dto.sortBy ?? defaultSortBy;
  const sortOrder = dto.sortOrder ?? 'desc';

  return {
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  };
}

export function buildPaginatedMeta(total: number, dto: PaginationDto) {
  const page = dto.page ?? 1;
  const limit = dto.limit ?? 20;
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}
