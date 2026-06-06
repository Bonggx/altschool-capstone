import { describe, it, expect } from "vitest";
import { Hospital } from "../../components/hospital/HospitalCard";

// Mirrors the client-side filter logic from Search.tsx
function filterHospitals(
  hospitals: Hospital[],
  query: string,
  ownership: "all" | "public" | "private",
  specialties: string[]
) {
  return hospitals.filter((h) => {
    const matchesQuery =
      !query ||
      h.name.toLowerCase().includes(query.toLowerCase()) ||
      h.city.toLowerCase().includes(query.toLowerCase()) ||
      h.lga.toLowerCase().includes(query.toLowerCase());

    const matchesOwnership = ownership === "all" || h.ownership_type === ownership;

    const matchesSpecialties =
      specialties.length === 0 ||
      specialties.every((s) => h.specialties.includes(s));

    return matchesQuery && matchesOwnership && matchesSpecialties;
  });
}

const hospitals: Hospital[] = [
  {
    id: "1", name: "Lagos General", address: "", city: "Lagos",
    lga: "Lagos Island", state: "Lagos", ownership_type: "public",
    specialties: ["Emergency", "Maternity"],
  },
  {
    id: "2", name: "Abuja Private Clinic", address: "", city: "Abuja",
    lga: "Wuse", state: "FCT", ownership_type: "private",
    specialties: ["Dental", "Pediatric"],
  },
  {
    id: "3", name: "Kano Health Centre", address: "", city: "Kano",
    lga: "Nassarawa", state: "Kano", ownership_type: "public",
    specialties: ["General", "Emergency"],
  },
];

describe("Search filter logic", () => {
  it("returns all hospitals when query and filters are empty", () => {
    expect(filterHospitals(hospitals, "", "all", [])).toHaveLength(3);
  });

  it("filters by name query", () => {
    const result = filterHospitals(hospitals, "lagos", "all", []);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Lagos General");
  });

  it("filters by city", () => {
    const result = filterHospitals(hospitals, "abuja", "all", []);
    expect(result[0].city).toBe("Abuja");
  });

  it("filters by ownership type", () => {
    const result = filterHospitals(hospitals, "", "private", []);
    expect(result).toHaveLength(1);
    expect(result[0].ownership_type).toBe("private");
  });

  it("filters by specialty", () => {
    const result = filterHospitals(hospitals, "", "all", ["Emergency"]);
    expect(result).toHaveLength(2);
  });

  it("returns empty when no match", () => {
    const result = filterHospitals(hospitals, "nonexistent", "all", []);
    expect(result).toHaveLength(0);
  });
});