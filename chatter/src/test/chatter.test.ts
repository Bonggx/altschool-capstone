import { describe, it, expect } from "vitest";
import {
  calculateReadingTime,
  slugify,
  stripHtml,
  generateExcerpt,
  formatNumber,
} from "../lib/utils";
import { signUpSchema, postSchema } from "../lib/validations";

// Tests for reading time calculation
describe("calculateReadingTime", () => {
  it("returns 1 minute for short content", () => {
    expect(calculateReadingTime("word ".repeat(100))).toBe(1);
  });
  it("returns correct minutes for longer content", () => {
    expect(calculateReadingTime("word ".repeat(600))).toBe(3);
  });
});

// Tests for slug generation
describe("slugify", () => {
  it("converts spaces to hyphens", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("removes special characters", () => {
    expect(slugify("Hello, World!")).toBe("hello-world");
  });
  it("converts to lowercase", () => {
    expect(slugify("HELLO WORLD")).toBe("hello-world");
  });
  it("handles multiple spaces", () => {
    expect(slugify("Hello   World")).toBe("hello-world");
  });
});

// Tests for HTML stripping
describe("stripHtml", () => {
  it("removes HTML tags", () => {
    expect(stripHtml("<p>Hello <strong>World</strong></p>")).toBe("Hello World");
  });
  it("returns plain text unchanged", () => {
    expect(stripHtml("Hello World")).toBe("Hello World");
  });
});

// Tests for excerpt generation
describe("generateExcerpt", () => {
  it("truncates long content with ellipsis", () => {
    const excerpt = generateExcerpt("word ".repeat(50), 50);
    expect(excerpt.endsWith("...")).toBe(true);
  });
  it("returns full content when shorter than maxLength", () => {
    expect(generateExcerpt("Short content", 160)).toBe("Short content");
  });
});

// Tests for number formatting
describe("formatNumber", () => {
  it("formats thousands with K", () => {
    expect(formatNumber(1500)).toBe("1.5K");
  });
  it("formats millions with M", () => {
    expect(formatNumber(2000000)).toBe("2.0M");
  });
  it("returns plain number below 1000", () => {
    expect(formatNumber(999)).toBe("999");
  });
});

// Validation schema tests
describe("signUpSchema", () => {
  it("rejects invalid email", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "password123",
      username: "testuser",
      fullName: "Test User",
    });
    expect(result.success).toBe(false);
  });
  it("rejects short password", () => {
    const result = signUpSchema.safeParse({
      email: "test@example.com",
      password: "123",
      username: "testuser",
      fullName: "Test User",
    });
    expect(result.success).toBe(false);
  });
  it("accepts valid sign up data", () => {
    const result = signUpSchema.safeParse({
      email: "test@example.com",
      password: "password123",
      username: "testuser",
      fullName: "Test User",
    });
    expect(result.success).toBe(true);
  });
});

describe("postSchema", () => {
  it("rejects a title that is too short", () => {
    const result = postSchema.safeParse({
      title: "Hi",
      content: "word ".repeat(20),
      tags: [],
      status: "draft",
    });
    expect(result.success).toBe(false);
  });
  it("rejects more than 5 tags", () => {
    const result = postSchema.safeParse({
      title: "A valid title here",
      content: "word ".repeat(20),
      tags: ["a", "b", "c", "d", "e", "f"],
      status: "draft",
    });
    expect(result.success).toBe(false);
  });
  it("accepts a valid post", () => {
    const result = postSchema.safeParse({
      title: "A valid title here",
      content: "word ".repeat(20),
      tags: ["technology"],
      status: "published",
    });
    expect(result.success).toBe(true);
  });
});
