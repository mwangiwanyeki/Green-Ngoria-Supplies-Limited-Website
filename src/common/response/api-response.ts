/**
 * Standardised API response envelope.
 * Every controller response should use these helpers to ensure consistency.
 */
export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: PaginatedMeta;
  errors?: unknown;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return { success: true, data, message };
}

export function paginatedResponse<T>(
  data: T[],
  meta: PaginatedMeta,
  message?: string,
): ApiResponse<T[]> {
  return { success: true, data, meta, message };
}

export function messageResponse(message: string): ApiResponse<null> {
  return { success: true, data: null, message };
}
