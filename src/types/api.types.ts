/**
 * Generic API response wrappers
 * @deprecated Use generated types from @/lib/api/generated/model instead
 */

export interface IBackendRes<T> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  posts?: T[];
  items?: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
