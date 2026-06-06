import { describe, it, expect } from "vitest";
import { isValidUrl, formatNumber, formatDate, getDeviceType } from "../lib/utils";
import { shortenFormSchema } from "../lib/validations";

// Unit tests for URL validation
describe("isValidUrl", () => {
  it("returns true for a valid https URL", () => {
    expect(isValidUrl("https://google.com")).toBe(true);
  });
  it("returns true for a valid http URL", () => {
    expect(isValidUrl("http://example.com")).toBe(true);
  });
  it("returns false for a URL with no protocol", () => {
    expect(isValidUrl("google.com")).toBe(false);
  });
  it("returns false for a completely invalid string", () => {
    expect(isValidUrl("not-a-url")).toBe(false);
  });
});

// Unit tests for number formatting
describe("formatNumber", () => {
  it("formats numbers below 1000 as plain numbers", () => {
    expect(formatNumber(999)).toBe("999");
  });
  it("formats thousands with K suffix", () => {
    expect(formatNumber(1500)).toBe("1.5K");
  });
  it("formats millions with M suffix", () => {
    expect(formatNumber(2000000)).toBe("2.0M");
  });
});

// Unit tests for device detection
describe("getDeviceType", () => {
  it("identifies mobile devices", () => {
    expect(getDeviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) Mobile/15E148")).toBe("mobile");
  });
  it("identifies desktop devices", () => {
    expect(getDeviceType("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)")).toBe("desktop");
  });
  it("identifies tablet devices", () => {
    expect(getDeviceType("Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)")).toBe("tablet");
  });
});

// Unit tests for slug validation
describe("shortenFormSchema - slug validation", () => {
  it("rejects slugs shorter than 3 characters", () => {
    const result = shortenFormSchema.safeParse({
      originalUrl: "https://example.com",
      customSlug: "ab",
    });
    expect(result.success).toBe(false);
  });
  it("rejects reserved slugs", () => {
    const result = shortenFormSchema.safeParse({
      originalUrl: "https://example.com",
      customSlug: "admin",
    });
    expect(result.success).toBe(false);
  });
  it("accepts a valid custom slug", () => {
    const result = shortenFormSchema.safeParse({
      originalUrl: "https://example.com",
      customSlug: "my-brand",
    });
    expect(result.success).toBe(true);
  });
  it("rejects an invalid URL", () => {
    const result = shortenFormSchema.safeParse({
      originalUrl: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});
