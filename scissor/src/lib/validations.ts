import { z } from "zod";

const RESERVED_SLUGS = [
  "api", "dashboard", "admin", "login", "signup",
  "logout", "register", "home", "about", "contact",
  "pricing", "help", "support", "terms", "privacy",
];

export const shortenFormSchema = z.object({
  originalUrl: z
    .string()
    .min(1, "Please enter a URL")
    .url("Please enter a valid URL starting with http:// or https://"),
  customSlug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be under 50 characters")
    .regex(/^[a-zA-Z0-9-]+$/, "Only letters, numbers, and hyphens are allowed")
    .refine((val) => !RESERVED_SLUGS.includes(val.toLowerCase()), "This slug is reserved and cannot be used")
    .optional()
    .or(z.literal("")),
  expiresAt: z.string().optional(),
});

export type ShortenFormData = z.infer<typeof shortenFormSchema>;
