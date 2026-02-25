import { z } from "zod";

export const profileUpdateSchema = z.object({
  userId: z.string(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  bio: z.string().max(500).optional(),
  image: z.string().url().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  location: z.string().max(100).optional().nullable(),
  occupation: z.string().max(100).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  github: z.string().max(50).optional().nullable(),
  linkedin: z.string().max(50).optional().nullable(),
  twitter: z.string().max(50).optional().nullable(),
});
