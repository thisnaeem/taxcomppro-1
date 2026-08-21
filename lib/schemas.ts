import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  agreeTerms: z.boolean().refine((v) => v === true, "You must agree to the terms"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const listingSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().min(20, "Description must be at least 20 characters").max(2000),
  category: z.enum(["SERVICE", "PRODUCT", "NETWORK", "TRAINING"]),
  price: z.number().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

export const communitySchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(60),
  slug: z.string().min(3).max(60).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(20).max(500),
  isPublic: z.boolean().default(true),
});

export const postSchema = z.object({
  content: z.string().min(1, "Post cannot be empty").max(5000),
});

export const profileSchema = z.object({
  name: z.string().min(2),
  bio: z.string().max(500).optional(),
  headline: z.string().max(120).optional(),
});

export const courseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150),
  slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().min(20, "Description must be at least 20 characters").max(3000),
  thumbnail: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]),
  price: z.number().min(0).default(0),
  isFree: z.boolean().default(true),
  category: z.string().min(2).max(60),
  tags: z.array(z.string()).optional(),
});

export const sectionSchema = z.object({
  title: z.string().min(2, "Section title must be at least 2 characters").max(120),
  order: z.number().int().min(0),
});

export const lessonSchema = z.object({
  title: z.string().min(2, "Lesson title must be at least 2 characters").max(150),
  description: z.string().max(1000).optional(),
  videoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  duration: z.number().int().min(0).default(0),
  order: z.number().int().min(0),
  isFree: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ListingInput = z.infer<typeof listingSchema>;
export type CommunityInput = z.infer<typeof communitySchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type SectionInput = z.infer<typeof sectionSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
