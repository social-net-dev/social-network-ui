/**
 * transform-openapi.ts
 *
 * Strips the ApiResponse<T> envelope from all 2xx responses in the OpenAPI spec.
 *
 * The TypeSpec contract wraps all success responses:
 *   { "success": true, "data": T, "request_id"?: string }
 *
 * But `attachResponseInterceptor.ts` already unwraps this at runtime, so the
 * actual data that Orval-generated hooks receive is T (not ApiResponse<T>).
 *
 * This transform produces `openapi.clean.json` where:
 *   - 2xx responses reference T directly
 *   - Error responses are unchanged
 *   - Component schemas are unchanged (still contain all models)
 *
 * Usage: tsx scripts/transform-openapi.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

type SchemaObject = Record<string, unknown>;
type ResponseObject = {
  description?: string;
  content?: Record<string, { schema?: SchemaObject }>;
  headers?: Record<string, unknown>;
};
type OpenAPIDocument = {
  paths?: Record<string, Record<string, { responses?: Record<string, ResponseObject> }>>;
  components?: SchemaObject;
  [key: string]: unknown;
};

const ROOT = resolve(__dirname, '..');
const INPUT = resolve(ROOT, 'tsp-output/schema/openapi.json');
const OUTPUT = resolve(ROOT, 'tsp-output/schema/openapi.clean.json');

/**
 * Detects whether a schema matches the ApiResponse<T> envelope pattern:
 *   { type: "object", required: ["success", "data"], properties: { success, data, request_id? } }
 */
function isEnvelopeSchema(schema: SchemaObject): boolean {
  if (schema.type !== 'object') return false;

  const required = schema.required as string[] | undefined;
  if (!required || !required.includes('success') || !required.includes('data')) return false;

  const props = schema.properties as Record<string, unknown> | undefined;
  if (!props) return false;

  // Check success: { type: boolean, enum: [true] }
  const successProp = props.success as SchemaObject | undefined;
  if (!successProp) return false;

  const successEnum = successProp.enum as unknown[] | undefined;
  if (!successEnum?.includes(true)) return false;

  // Must have a data property
  return 'data' in props;
}

/**
 * Extracts the inner `data` schema from an envelope schema.
 */
function extractDataSchema(schema: SchemaObject): SchemaObject {
  const props = schema.properties as Record<string, SchemaObject>;
  return props.data;
}

function transformDocument(doc: OpenAPIDocument): OpenAPIDocument {
  const result: OpenAPIDocument = JSON.parse(JSON.stringify(doc));
  let transformed = 0;

  if (!result.paths) return result;

  for (const [path, methods] of Object.entries(result.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!operation.responses) continue;

      for (const [statusCode, response] of Object.entries(operation.responses)) {
        // Only process 2xx success responses
        const code = parseInt(statusCode, 10);
        if (isNaN(code) || code < 200 || code >= 300) continue;

        if (!response.content) continue;

        for (const [contentType, mediaType] of Object.entries(response.content)) {
          if (!mediaType.schema) continue;

          if (isEnvelopeSchema(mediaType.schema)) {
            const innerSchema = extractDataSchema(mediaType.schema);
            result.paths![path][method].responses![statusCode].content![contentType].schema = innerSchema;
            transformed++;
            console.log(`  ✓ ${method.toUpperCase()} ${path} [${statusCode}] → unwrapped`);
          }
        }
      }
    }
  }

  console.log(`\nTransformed ${transformed} responses.`);
  return result;
}

console.log(`Reading: ${INPUT}`);
const raw = readFileSync(INPUT, 'utf-8');
const doc: OpenAPIDocument = JSON.parse(raw);

console.log('Stripping ApiResponse<T> envelopes...');
const clean = transformDocument(doc);

writeFileSync(OUTPUT, JSON.stringify(clean, null, 2), 'utf-8');
console.log(`\nWrote: ${OUTPUT}`);
