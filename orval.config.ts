import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: '../learn-typespec/tsp-output/schema/openapi.json',
    output: {
      client: 'react-query',
      httpClient: 'axios',
      mode: 'tags-split',
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