import { defineConfig } from 'orval';

export default defineConfig({
  socialNetwork: {
    output: {
      mode: 'tags-split',
      target: 'src/lib/api/generated',
      schemas: 'src/lib/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      override: {
        mutator: {
          path: './src/lib/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
    input: {
      target: process.env.VITE_API_BASE_URL 
        ? `${process.env.VITE_API_BASE_URL}/openapi.json` 
        : 'http://localhost:8000/openapi.json',
    },
  },
});
