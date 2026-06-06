import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchFilters, { Filters } from "../../components/hospital/SearchFilters";

const defaultFilters: Filters = {
  ownership: "all",
  specialties: [],
  radius: null,
};

describe("SearchFilters component", () => {
  it("renders all ownership buttons", () => {
    render(<SearchFilters filters={defaultFilters} onChange={vi.fn()} userLocationAvailable={false} />);
    expect(screen.getByText("all")).toBeTruthy();
    expect(screen.getByText("public")).toBeTruthy();
    expect(screen.getByText("private")).toBeTruthy();
  });

  it("calls onChange when ownership is changed", () => {
    const onChange = vi.fn();
    render(<SearchFilters filters={defaultFilters} onChange={onChange} userLocationAvailable={false} />);
    fireEvent.click(screen.getByText("public"));
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, ownership: "public" });
  });

  it("toggles a specialty on click", () => {
    const onChange = vi.fn();
    render(<SearchFilters filters={defaultFilters} onChange={onChange} userLocationAvailable={false} />);
    fireEvent.click(screen.getByText("Emergency"));
    expect(onChange).toHaveBeenCalledWith({ ...defaultFilters, specialties: ["Emergency"] });
  });

  it("hides radius filter when location is not available", () => {
    render(<SearchFilters filters={defaultFilters} onChange={vi.fn()} userLocationAvailable={false} />);
    expect(screen.queryByText("Distance (km)")).toBeNull();
  });

  it("shows radius filter when location is available", () => {
    render(<SearchFilters filters={defaultFilters} onChange={vi.fn()} userLocationAvailable={true} />);
    expect(screen.getByText("Distance (km)")).toBeTruthy();
  });

  it("shows clear button when filters are active", () => {
    render(
      <SearchFilters
        filters={{ ...defaultFilters, ownership: "private" }}
        onChange={vi.fn()}
        userLocationAvailable={false}
      />
    );
    expect(screen.getByText("Clear all filters")).toBeTruthy();
  });
});