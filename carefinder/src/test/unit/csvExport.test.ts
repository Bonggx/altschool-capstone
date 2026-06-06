import { describe, it, expect } from "vitest";
import Papa from "papaparse";
import { Hospital } from "../../components/hospital/HospitalCard";

// Simulates the export logic from ExportButton
function exportToCsv(hospitals: Hospital[], columns: (keyof Hospital)[]) {
  const rows = hospitals.map((h) => {
    const row: Record<string, any> = {};
    columns.forEach((col) => {
      const val = h[col];
      row[col] = Array.isArray(val) ? val.join("; ") : (val ?? "");
    });
    return row;
  });
  return Papa.unparse(rows);
}

const mockHospitals: Hospital[] = [
  {
    id: "1",
    name: "Lagos General Hospital",
    address: "1 Marina Road",
    city: "Lagos",
    lga: "Lagos Island",
    state: "Lagos",
    phone: "+234 800 000 0001",
    email: "info@lgh.ng",
    ownership_type: "public",
    specialties: ["Emergency", "Maternity"],
    average_rating: 4.2,
    review_count: 10,
  },
  {
    id: "2",
    name: "Abuja Clinic",
    address: "5 Wuse Zone 4",
    city: "Abuja",
    lga: "Wuse",
    state: "FCT",
    ownership_type: "private",
    specialties: ["Dental"],
    average_rating: 3.8,
    review_count: 5,
  },
];

describe("CSV Export", () => {
  it("exports all selected columns", () => {
    const csv = exportToCsv(mockHospitals, ["name", "city", "state"]);
    expect(csv).toContain("Lagos General Hospital");
    expect(csv).toContain("Abuja Clinic");
    expect(csv).toContain("name");
    expect(csv).toContain("city");
    expect(csv).toContain("state");
  });

  it("flattens array fields to semicolon-separated string", () => {
    const csv = exportToCsv(mockHospitals, ["name", "specialties"]);
    expect(csv).toContain("Emergency; Maternity");
  });

  it("excludes columns not selected", () => {
    const csv = exportToCsv(mockHospitals, ["name"]);
    expect(csv).not.toContain("Lagos Island");
    expect(csv).not.toContain("phone");
  });

  it("handles missing optional fields gracefully", () => {
    const csv = exportToCsv(mockHospitals, ["name", "phone"]);
    // Abuja Clinic has no phone — should export empty string not undefined
    expect(csv).not.toContain("undefined");
  });
});