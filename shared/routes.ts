import { z } from 'zod';
import { causeSchema } from './schema';

// Minimal API contract since logic is client-side.
// We provide structure in case backend sync is added later.

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  // Get all causes from the database
  causes: {
    getAll: {
      method: 'GET' as const,
      path: '/api/causes',
      input: z.object({}),
      responses: {
        200: z.object({
          causes: z.array(causeSchema),
        }),
      },
    }
  },
  // Placeholder for potential future sync
  sync: {
    push: {
      method: 'POST' as const,
      path: '/api/sync',
      input: z.object({
        causes: z.array(causeSchema),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
      },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
