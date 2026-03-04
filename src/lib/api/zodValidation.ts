import type { ZodType, ZodError } from 'zod';

/**
 * Parses and validates data strictly against a Zod schema.
 * Throws ZodError if validation fails.
 */
export function parseResponse<T>(schema: ZodType<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Validates data against a Zod schema in development mode.
 * - In DEV: logs a warning on failure but returns original data (non-throwing)
 * - In PROD: returns data as-is without validation
 */
export function safeParseResponse<T>(schema: ZodType<T>, data: unknown): T {
  if (import.meta.env.DEV) {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.warn('[zodValidation] Response validation failed:', (result.error as ZodError).format());
    }
  }
  return data as T;
}

/**
 * Creates a `select` function for use in TanStack Query hooks.
 * Validates the response schema in development mode (non-throwing).
 *
 * @example
 * import { feedResponseSchema } from '@/lib/api/schemas/feed';
 * import { createZodSelect } from '@/lib/api/zodValidation';
 *
 * const { data } = useFeedGetFeed(params, {
 *   query: { select: createZodSelect(FeedGetFeedResponse) },
 * });
 */
export function createZodSelect<T>(schema: ZodType<T>): (data: unknown) => T {
  return (data: unknown) => safeParseResponse(schema, data);
}
