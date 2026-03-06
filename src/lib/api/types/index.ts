/**
 * API Types — auto-generated from contract/main.tsp via Orval.
 *
 * Workflow:
 *   1. pnpm gen:spec   → tsp-output/schema/openapi.json
 *   2. pnpm gen:clean  → tsp-output/schema/openapi.clean.json  (envelope stripped)
 *   3. pnpm gen:hooks  → src/lib/api/generated/  (Orval: models + endpoints + hooks)
 *
 * Do NOT edit src/lib/api/generated/ manually.
 * Only add frontend-only types below the "Frontend-only types" section.
 */

// Re-export all Orval-generated types (models from OpenAPI spec)
export * from '../generated/model';

// ─── Frontend-only types (not representable in OpenAPI as generics) ───────────

import type { PaginationMeta, CursorPaginationMeta } from '../generated/model';

/** Generic envelope — matches server's `{ success, data, request_id }` shape */
export interface ApiResponse<T> {
  success: true;
  data: T;
  request_id?: string;
}

/** Page-based pagination wrapper (e.g. friend list) */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

/** Cursor-based pagination wrapper (e.g. comments, followers) */
export interface CursorPaginatedResponse<T> {
  items: T[];
  pagination: CursorPaginationMeta;
}

/** Response for forgot-password OTP send (not in OpenAPI schema) */
export interface ForgotPasswordResponse {
  message: string;
  user_id?: string;
}
