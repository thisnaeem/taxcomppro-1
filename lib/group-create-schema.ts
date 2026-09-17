import { z } from "zod";

export const groupCreateSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters for the group name.").max(100),
  description: z.string().trim().min(10, "Tell members about your group in at least 10 characters.").max(2000),
  coverImage: z.string().url().startsWith("https://").max(2048).nullable().optional(),
  icon: z.string().max(2048).nullable().optional(),
  isPublic: z.boolean().default(true),
});
