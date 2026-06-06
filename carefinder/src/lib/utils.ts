import { format } from "date-fns";
import Papa from "papaparse";

// Formats a date string into a readable format like "Jun 03, 2026"
export function formatDate(date: string | Date) {
  return format(new Date(date), "MMM dd, yyyy");
}

// Copies text to the clipboard and returns a promise
export function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}

// Formats a number to one decimal place for ratings display
export function formatRating(rating: number) {
  return rating.toFixed(1);
}

// Converts an array of specialty strings into a readable comma-separated list
export function formatSpecialties(specialties: string[]) {
  if (!specialties || specialties.length === 0) return "General";
  return specialties.join(", ");
}

// Calculates the distance in kilometers between two lat/lng points
// Uses the Haversine formula
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Exports hospital data to a CSV file using PapaParse
// Triggers a client-side file download with no server round-trip
export function exportToCSV(
  hospitals: any[],
  columns: string[],
  filename: string
) {
  // Only include the columns the user selected
  const data = hospitals.map((h) => {
    const row: any = {};
    columns.forEach((col) => {
      if (col === "specialties") {
        row[col] = Array.isArray(h[col]) ? h[col].join(", ") : "";
      } else {
        row[col] = h[col] ?? "";
      }
    });
    return row;
  });

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

// Builds a shareable URL from the current filter state
// e.g. /search?city=Lagos&specialty=maternity&radius=10
export function buildShareableUrl(filters: Record<string, string | number>) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== undefined && value !== null) {
      params.set(key, String(value));
    }
  });
  return `${window.location.origin}/search?${params.toString()}`;
}

// Sanitizes a Markdown string to plain text for display in cards
export function stripMarkdown(text: string) {
  return text
    .replace(/#{1,6}\s/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

// Filters hospitals by search query — checks name, city, and LGA
export function filterHospitals(
  hospitals: any[],
  query: string,
  specialty: string,
  ownershipType: string
) {
  return hospitals.filter((h) => {
    const matchesQuery =
      !query ||
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.city.toLowerCase().includes(query.toLowerCase()) ||
      (h.lga && h.lga.toLowerCase().includes(query.toLowerCase()));

    const matchesSpecialty =
      !specialty ||
      (h.specialties && h.specialties.some((s: string) =>
        s.toLowerCase().includes(specialty.toLowerCase())
      ));

    const matchesOwnership =
      !ownershipType || h.ownership_type === ownershipType;

    return matchesQuery && matchesSpecialty && matchesOwnership;
  });
}
