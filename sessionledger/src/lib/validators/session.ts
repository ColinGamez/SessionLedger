import { z } from 'zod'

// ----------------------------------------------------------------
// Session create / update schema
// ----------------------------------------------------------------
export const SessionCreateSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters')
    .trim(),

  started_at: z
    .string()
    .datetime({ message: 'started_at must be a valid ISO 8601 datetime' }),

  in_amount: z
    .number({ invalid_type_error: 'in_amount must be a number' })
    .nonnegative('in_amount must be >= 0')
    .multipleOf(0.01, 'in_amount can have at most 2 decimal places'),

  out_amount: z
    .number({ invalid_type_error: 'out_amount must be a number' })
    .nonnegative('out_amount must be >= 0')
    .multipleOf(0.01, 'out_amount can have at most 2 decimal places'),

  notes: z
    .string()
    .max(5000, 'Notes must be under 5000 characters')
    .optional()
    .nullable()
    .default(null),

  tags: z
    .array(
      z.string().min(1).max(50, 'Each tag must be under 50 characters').trim()
    )
    .max(20, 'Maximum 20 tags per session')
    .default([]),
})

export const SessionUpdateSchema = SessionCreateSchema.partial()

export type SessionCreateInput = z.infer<typeof SessionCreateSchema>
export type SessionUpdateInput = z.infer<typeof SessionUpdateSchema>

// ----------------------------------------------------------------
// Query / filter schema (for list endpoint)
// ----------------------------------------------------------------
export const SessionQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1))
    .pipe(z.number().int().positive()),

  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),

  tag: z.string().optional(),

  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
})

export type SessionQueryInput = z.infer<typeof SessionQuerySchema>
