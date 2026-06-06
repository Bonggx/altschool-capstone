import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirrors the hospital form schema from HospitalForm.tsx
const hospitalSchema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(1, "City is required"),
  lga: z.string().min(1, "LGA is required"),
  state: z.string().min(1, "State is required"),
  phone: z.string().regex(/^[0-9+\-\s()]{7,15}$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email").or(z.literal("")),
  ownership_type: z.enum(["public", "private"]),
});

describe("Hospital form validation", () => {
  const valid = {
    name: "Lagos General Hospital",
    address: "1 Marina Road",
    city: "Lagos",
    lga: "Lagos Island",
    state: "Lagos",
    phone: "+2348000000001",
    email: "info@lgh.ng",
    ownership_type: "public" as const,
  };

  it("passes with valid data", () => {
    expect(() => hospitalSchema.parse(valid)).not.toThrow();
  });

  it("rejects a name that is too short", () => {
    const result = hospitalSchema.safeParse({ ...valid, name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid phone number", () => {
    const result = hospitalSchema.safeParse({ ...valid, phone: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = hospitalSchema.safeParse({ ...valid, email: "notanemail" });
    expect(result.success).toBe(false);
  });

  it("allows empty string for optional email", () => {
    const result = hospitalSchema.safeParse({ ...valid, email: "" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid ownership type", () => {
    const result = hospitalSchema.safeParse({ ...valid, ownership_type: "ngo" as any });
    expect(result.success).toBe(false);
  });
});