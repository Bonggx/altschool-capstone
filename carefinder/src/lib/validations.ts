import { z } from "zod";

// Nigerian phone number regex —> accepts formats like +234-1-234-5678 or 08012345678
const nigerianPhoneRegex = /^(\+234|0)[0-9]{10}$/;

// Validation schema for creating or editing a hospital entry
export const hospitalSchema = z.object({
  name: z
    .string()
    .min(3, "Hospital name must be at least 3 characters")
    .max(200, "Hospital name must be under 200 characters"),

  address: z
    .string()
    .min(5, "Please enter a valid address"),

  city: z
    .string()
    .min(2, "Please enter a city"),

  state: z
    .string()
    .min(2, "Please enter a state"),

  lga: z.string().optional(),

  phone: z
    .string()
    .regex(nigerianPhoneRegex, "Please enter a valid Nigerian phone number"),

  email: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),

  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),

  ownership_type: z.enum(["public", "private"]),

  specialties: z
    .array(z.string())
    .min(1, "Please select at least one specialty"),

  description: z.string().optional(),

  visiting_hours: z.string().optional(),

  // Latitude must be within Nigeria's geographic bounds
  latitude: z
    .number()
    .min(4.0, "Latitude must be within Nigeria")
    .max(14.0, "Latitude must be within Nigeria"),

  // Longitude must be within Nigeria's geographic bounds
  longitude: z
    .number()
    .min(2.5, "Longitude must be within Nigeria")
    .max(15.0, "Longitude must be within Nigeria"),
});

// Validation schema for submitting a review
export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, "Please select a rating")
    .max(5, "Rating cannot exceed 5"),

  content: z
    .string()
    .max(500, "Review must be under 500 characters")
    .optional(),
});

// Validation schema for the admin sign in form
export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Please enter your password"),
});

export type HospitalData = z.infer<typeof hospitalSchema>;
export type ReviewData = z.infer<typeof reviewSchema>;
export type SignInData = z.infer<typeof signInSchema>;
