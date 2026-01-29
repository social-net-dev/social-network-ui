/**
 * Generic backend response wrapper
 */
export interface IBackendRes<T> {
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

/**
 * Paginated response model
 */
export interface IModelPaginate<T> {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/**
 * Alternative naming for backend responses
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated list response
 */
export interface PaginatedResponse<T> {
  posts?: T[];
  items?: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}
