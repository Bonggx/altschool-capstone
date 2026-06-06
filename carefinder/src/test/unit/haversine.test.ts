import { describe, it, expect } from "vitest";

// Haversine formula = same function used in Search.tsx
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

describe("Haversine distance calculation", () => {
  it("returns 0 for identical coordinates", () => {
    expect(haversineKm(6.5244, 3.3792, 6.5244, 3.3792)).toBe(0);
  });

  it("calculates Lagos to Abuja distance (~480 km)", () => {
    const dist = haversineKm(6.5244, 3.3792, 9.0765, 7.3986);
    expect(dist).toBeGreaterThan(450);
    expect(dist).toBeLessThan(520);
  });

  it("returns a positive number for any two different points", () => {
    expect(haversineKm(4.0, 5.0, 6.0, 7.0)).toBeGreaterThan(0);
  });

  it("is symmetric — distance A to B equals B to A", () => {
    const ab = haversineKm(6.5244, 3.3792, 9.0765, 7.3986);
    const ba = haversineKm(9.0765, 7.3986, 6.5244, 3.3792);
    expect(Math.abs(ab - ba)).toBeLessThan(0.001);
  });
});