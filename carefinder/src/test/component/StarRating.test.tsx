import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StarRating from "../../components/ui/StarRating";

describe("StarRating component", () => {
  it("renders 5 stars", () => {
    render(<StarRating value={3} readonly />);
    const stars = document.querySelectorAll("[data-star]");
    expect(stars.length).toBe(5);
  });

  it("does not call onChange when readonly", () => {
    const onChange = vi.fn();
    render(<StarRating value={3} readonly onChange={onChange} />);
    const stars = document.querySelectorAll("[data-star]");
    fireEvent.click(stars[0]);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("calls onChange with correct value when a star is clicked", () => {
    const onChange = vi.fn();
    render(<StarRating value={0} onChange={onChange} />);
    const stars = document.querySelectorAll("[data-star]");
    fireEvent.click(stars[3]); // 4th star = rating 4
    expect(onChange).toHaveBeenCalledWith(4);
  });
});