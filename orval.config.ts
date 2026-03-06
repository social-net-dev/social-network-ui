import { defineConfig } from 'orval';

/**
 * Orval configuration — generates type-safe React Query hooks from the clean OpenAPI spec.
 *
 * Pipeline:
 *   1. pnpm gen:spec   → tsp-output/schema/openapi.json  (TypeSpec → OpenAPI, with envelope)
 *   2. pnpm gen:clean  → tsp-output/schema/openapi.clean.json  (envelope stripped)
 *   3. pnpm gen:hooks  → src/lib/api/generated/  (Orval: models + endpoints + hooks)
 *
 * The custom mutator (`customInstance`) already handles:
 *   - Auth token injection (via attachRequestInterceptor)
 *   - Response unwrapping (via attachResponseInterceptor)
 *   - Token refresh on 401
 */
export default defineConfig({
  socialNetwork: {
    input: {
      target: './tsp-output/schema/openapi.clean.json',
    },
    output: {
      mode: 'tags-split',
      target: 'src/lib/api/generated',
      schemas: 'src/lib/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: {
          path: 'src/lib/api.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useSuspenseQuery: false,
          useInfinite: false,
          options: {
            staleTime: 10_000,
          },
        },
        operations: {
          // ── Cursor-paginated endpoints (infinite queries) ──────────────────
          // Only endpoints whose Params type has a `cursor` field should be here.
          Feed_getFeed: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'cursor',
            },
          },
          Posts_listPosts: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'cursor',
            },
          },
          Posts_getMyPosts: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'cursor',
            },
          },
          Posts_getPostsByUser: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'cursor',
            },
          },
          Posts_getPostComments: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'cursor',
            },
          },
          Comments_getReplies: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'cursor',
            },
          },
          Follows_getFollowers: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'cursor',
            },
          },
          Follows_getFollowing: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'cursor',
            },
          },
          Notifications_listNotifications: {
            query: {
              useInfinite: true,
              useInfiniteQueryParam: 'cursor',
            },
          },
        },
      },
    },
  },
});
