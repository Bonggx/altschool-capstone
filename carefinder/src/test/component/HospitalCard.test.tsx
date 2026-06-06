import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HospitalCard, { Hospital } from "../../components/hospital/HospitalCard";

const mockHospital: Hospital = {
  id: "1",
  name: "Lagos General Hospital",
  address: "1 Marina Road",
  city: "Lagos",
  lga: "Lagos Island",
  state: "Lagos",
  ownership_type: "public",
  specialties: ["Emergency", "Maternity", "Pediatric"],
  average_rating: 4.2,
  review_count: 15,
};

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <HospitalCard hospital={mockHospital} {...props} />
    </MemoryRouter>
  );
}

describe("HospitalCard component", () => {
  it("renders hospital name", () => {
    renderCard();
    expect(screen.getByText("Lagos General Hospital")).toBeTruthy();
  });

  it("renders city and state in address", () => {
    renderCard();
    expect(screen.getByText(/Lagos.*Lagos/)).toBeTruthy();
  });

  it("renders ownership type badge", () => {
    renderCard();
    expect(screen.getByText("public")).toBeTruthy();
  });

  it("renders specialties", () => {
    renderCard();
    expect(screen.getByText("Emergency")).toBeTruthy();
    expect(screen.getByText("Maternity")).toBeTruthy();
  });

  it("renders review count", () => {
    renderCard();
    expect(screen.getByText(/4\.2/)).toBeTruthy();
  });

  it("highlights search term in name", () => {
    renderCard({ searchTerm: "Lagos" });
    const mark = document.querySelector("mark");
    expect(mark).toBeTruthy();
    expect(mark?.textContent).toBe("Lagos");
  });

  it("shows distance badge when distance_km is provided", () => {
    renderCard({ hospital: { ...mockHospital, distance_km: 3.7 } });
    expect(screen.getByText(/3\.7 km away/)).toBeTruthy();
  });
});