import Badge from "../ui/Badge";

// All supported specialty options
const SPECIALTIES = [
  "Emergency", "Maternity", "Pediatric", "Dental",
  "Cardiology", "Orthopedic", "Neurology", "Oncology",
  "Ophthalmology", "Dermatology", "Psychiatry", "General", "Radiology",
];

export interface Filters {
  ownership: "all" | "public" | "private";
  specialties: string[];
  radius: number | null; // km, null means no radius filter
}

interface SearchFiltersProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  userLocationAvailable: boolean; // radius filter only shown when geolocation is available
}

export default function SearchFilters({ filters, onChange, userLocationAvailable }: SearchFiltersProps) {
  // Toggles a specialty in/out of the active filter list
  function toggleSpecialty(spec: string) {
    const already = filters.specialties.includes(spec);
    onChange({
      ...filters,
      specialties: already
        ? filters.specialties.filter((s) => s !== spec)
        : [...filters.specialties, spec],
    });
  }

  function setOwnership(value: Filters["ownership"]) {
    onChange({ ...filters, ownership: value });
  }

  function setRadius(value: number | null) {
    onChange({ ...filters, radius: value });
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col gap-5">

      {/* Ownership type */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Ownership</p>
        <div className="flex gap-2 flex-wrap">
          {(["all", "public", "private"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setOwnership(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                filters.ownership === type
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Specialty multi-select */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Specialties</p>
        <div className="flex flex-wrap gap-2">
          {SPECIALTIES.map((spec) => (
            <Badge
              key={spec}
              label={spec}
              variant={filters.specialties.includes(spec) ? "pink" : "gray"}
              onClick={() => toggleSpecialty(spec)}
            />
          ))}
        </div>
      </div>

      {/* Radius filter = only shown when user granted geolocation */}
      {userLocationAvailable && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
            Distance (km)
          </p>
          <div className="flex gap-2 flex-wrap">
            {[null, 5, 10, 25, 50].map((r) => (
              <button
                key={r ?? "any"}
                onClick={() => setRadius(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  filters.radius === r
                    ? "bg-brand-500 text-white border-brand-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-brand-300"
                }`}
              >
                {r === null ? "Any" : `${r} km`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reset all filters */}
      {(filters.ownership !== "all" || filters.specialties.length > 0 || filters.radius !== null) && (
        <button
          onClick={() => onChange({ ownership: "all", specialties: [], radius: null })}
          className="text-xs text-brand-500 hover:text-brand-700 font-medium self-start transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}