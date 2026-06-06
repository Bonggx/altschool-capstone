import { useState } from "react";
import Papa from "papaparse";
import { Hospital } from "./HospitalCard";
import Button from "../ui/Button";
import Modal from "../ui/Modal";

interface ExportButtonProps {
  hospitals: Hospital[];
  searchQuery?: string;
}

// All exportable columns with display labels
const ALL_COLUMNS: { key: keyof Hospital; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "lga", label: "LGA" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "ownership_type", label: "Ownership" },
  { key: "specialties", label: "Specialties" },
  { key: "average_rating", label: "Rating" },
];

export default function ExportButton({ hospitals, searchQuery }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  // Default = all columns selected
  const [selected, setSelected] = useState<Set<keyof Hospital>>(
    new Set(ALL_COLUMNS.map((c) => c.key))
  );

  function toggleColumn(key: keyof Hospital) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleExport() {
    // Builds rows using only the selected columns
    const rows = hospitals.map((h) => {
      const row: Record<string, any> = {};
      ALL_COLUMNS.forEach(({ key, label }) => {
        if (!selected.has(key)) return;
        const val = h[key];
        // Flattens arrays (specialties) to a semicolon-separated string
        row[label] = Array.isArray(val) ? val.join("; ") : (val ?? "");
      });
      return row;
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Filename includes the search query and today's date for traceability
    const date = new Date().toISOString().split("T")[0];
    const slug = searchQuery ? `-${searchQuery.toLowerCase().replace(/\s+/g, "-")}` : "";
    const filename = `hospitals${slug}-${date}.csv`;

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Export CSV
      </Button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title="Export Hospitals">
        <p className="text-sm text-gray-500 mb-4">
          Select the columns to include in your CSV export.
        </p>

        {/* Column checkboxes */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {ALL_COLUMNS.map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={selected.has(key)}
                onChange={() => toggleColumn(key)}
                className="accent-brand-500 w-4 h-4"
              />
              <span className="text-sm text-gray-700 group-hover:text-brand-600 transition-colors">
                {label}
              </span>
            </label>
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            disabled={selected.size === 0}
          >
            Download CSV ({hospitals.length} records)
          </Button>
        </div>
      </Modal>
    </>
  );
}