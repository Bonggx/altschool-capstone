import { z } from "zod";

// Validation schema for the sign up form
export const signUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be under 72 characters"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be under 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed"),
  fullName: z.string().min(2, "Please enter your full name"),
});

// Validation schema for the sign in form
export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

// Validation schema for creating or editing a post
export const postSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be under 200 characters"),
  content: z.string().min(50, "Post must be at least 50 characters"),
  excerpt: z
    .string()
    .max(300, "Excerpt must be under 300 characters")
    .optional(),
  tags: z.array(z.string()).max(5, "You can only add up to 5 tags"),
  status: z.enum(["draft", "published", "archived"]),
});

// Validation schema for editing a user profile
export const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().max(300, "Bio must be under 300 characters").optional(),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  twitter: z.string().optional(),
  github: z.string().optional(),
});

export type SignUpData = z.infer<typeof signUpSchema>;
export type SignInData = z.infer<typeof signInSchema>;
export type PostData = z.infer<typeof postSchema>;
export type ProfileData = z.infer<typeof profileSchema>;
