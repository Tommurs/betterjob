import { z } from 'zod'

export const jobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  company: z.string().min(2, 'Company name required').max(100),
  location: z.string().min(2, 'Location required'),
  type: z.enum(['full_time', 'part_time', 'contract', 'remote']),
  salary_min: z.number().positive().optional(),
  salary_max: z.number().positive().optional(),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.array(z.string()).min(1, 'At least one requirement'),
})

export type JobFormData = z.infer<typeof jobSchema>
