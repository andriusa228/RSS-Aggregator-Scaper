import { z } from 'zod';

export const IngestAllRequestSchema = z.object({
  strategy: z.enum(['AUTO', 'RSS', 'HTML']).optional(),
  categorySlug: z.string().min(1).optional(),
});

export const IngestStatusQuerySchema = z.object({
  jobId: z.string().min(1),
});

export type IngestAllRequest = z.infer<typeof IngestAllRequestSchema>;
export type IngestStatusQuery = z.infer<typeof IngestStatusQuerySchema>;

export function validateIngestRequest(body: unknown): IngestAllRequest {
  try {
    return IngestAllRequestSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export function validateStatusQuery(searchParams: URLSearchParams): IngestStatusQuery {
  try {
    return IngestStatusQuerySchema.parse({
      jobId: searchParams.get('jobId'),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
