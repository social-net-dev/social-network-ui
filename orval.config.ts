import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: './tsp-output/schema/openapi.json',
    output: {
      client: 'react-query',
      httpClient: 'axios',
      mode: 'tags-split',
      mock: true,
      target: './src/lib/api/generated/index.ts',
      schemas: './src/lib/api/generated/model',
      override: {
        mutator: {
          path: './src/lib/api.ts',
          name: 'customInstance',
        },
      },
    },
  },
});