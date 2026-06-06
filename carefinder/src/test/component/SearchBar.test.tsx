import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchBar from "../../components/hospital/SearchBar";

describe("SearchBar component", () => {
  it("renders the search input", () => {
    render(<SearchBar onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText(/Search by hospital/i)).toBeTruthy();
  });

  it("calls onSearch with query on form submit", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText(/Search by hospital/i);
    fireEvent.change(input, { target: { value: "Lagos" } });
    fireEvent.submit(input.closest("form")!);
    expect(onSearch).toHaveBeenCalledWith("Lagos");
  });

  it("shows clear button when input has text", () => {
    render(<SearchBar onSearch={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Search by hospital/i);
    fireEvent.change(input, { target: { value: "Abuja" } });
    expect(screen.getByLabelText("Clear search")).toBeTruthy();
  });

  it("clears input and calls onSearch with empty string on clear", () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByPlaceholderText(/Search by hospital/i);
    fireEvent.change(input, { target: { value: "Kano" } });
    fireEvent.click(screen.getByLabelText("Clear search"));
    expect((input as HTMLInputElement).value).toBe("");
    expect(onSearch).toHaveBeenCalledWith("");
  });

  it("pre-fills with initialValue", () => {
    render(<SearchBar onSearch={vi.fn()} initialValue="Ibadan" />);
    const input = screen.getByPlaceholderText(/Search by hospital/i) as HTMLInputElement;
    expect(input.value).toBe("Ibadan");
  });
});