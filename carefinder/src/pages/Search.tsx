import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SearchBar from "../components/hospital/SearchBar";
import SearchFilters, { Filters } from "../components/hospital/SearchFilters";
import HospitalCard, { Hospital } from "../components/hospital/HospitalCard";
import ExportButton from "../components/hospital/ExportButton";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initializes state from URL params so shareable links reproduce the search
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<Filters>({
    ownership: (searchParams.get("ownership") as Filters["ownership"]) ?? "all",
    specialties: searchParams.get("specialties")?.split(",").filter(Boolean) ?? [],
    radius: searchParams.get("radius") ? Number(searchParams.get("radius")) : null,
  });

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Requests geolocation on mount —> pre-populates radius search if granted
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => setLocationLoading(false)
    );
  }, []);

  // Re-runs search whenever query or filters change
  useEffect(() => {
    fetchHospitals();
    syncUrlParams();
  }, [query, filters]);

  // Keeps URL params in sync so the page is shareable at any point
  function syncUrlParams() {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (filters.ownership !== "all") params.ownership = filters.ownership;
    if (filters.specialties.length) params.specialties = filters.specialties.join(",");
    if (filters.radius) params.radius = String(filters.radius);
    setSearchParams(params, { replace: true });
  }

  async function fetchHospitals() {
    setLoading(true);

    let q = supabase
      .from("hospitals")
      .select("*")
      .eq("is_approved", true);

    // Full-text search across name, city, and LGA using pg_trgm
    if (query) {
      q = q.or(`name.ilike.%${query}%,city.ilike.%${query}%,lga.ilike.%${query}%,state.ilike.%${query}%`);
    }

    // Ownership filter
    if (filters.ownership !== "all") {
      q = q.eq("ownership_type", filters.ownership);
    }

    // Specialty filter —> checks if array column contains all selected specialties
    if (filters.specialties.length > 0) {
      q = q.overlaps("specialties", filters.specialties);
    }

    const { data, error } = await q.order("name").limit(50);

    if (error) {
      console.error("Hospital fetch error:", error.message);
      setHospitals([]);
    } else {
      let results = data as Hospital[];

      // Client-side radius filter using Haversine distance when location + radius are set
      if (userLocation && filters.radius) {
        results = results.filter((h: any) => {
          if (!h.latitude || !h.longitude) return false;
          const dist = haversineKm(userLocation.lat, userLocation.lng, h.latitude, h.longitude);
          h.distance_km = dist;
          return dist <= filters.radius!;
        });
        // Sorts by distance when radius is active
        results.sort((a: any, b: any) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
      }

      setHospitals(results);
    }

    setLoading(false);
  }

  // Haversine formula = calculates straight-line distance between two lat/lng points
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

  // Copy the current URL to clipboard as a shareable link
  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

      {/* Page header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-gray-900 mb-1">Find Hospitals</h1>
        <p className="text-sm text-gray-500">
          Search Nigeria's hospital directory by name, city, or local government area.
        </p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <SearchBar initialValue={query} onSearch={setQuery} loading={loading} />
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* Filters sidebar */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <SearchFilters
            filters={filters}
            onChange={setFilters}
            userLocationAvailable={!!userLocation}
          />

          {/* Geolocation status message */}
          {locationLoading && (
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Detecting your location...
            </p>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">

          {/* Results header — count + action buttons */}
          {!loading && (
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <p className="text-sm text-gray-500">
                {hospitals.length === 0
                  ? "No hospitals found"
                  : `${hospitals.length} hospital${hospitals.length !== 1 ? "s" : ""} found`}
                {query && <span className="text-gray-400"> for "{query}"</span>}
              </p>

              <div className="flex items-center gap-2">
                {/* Copy share link */}
                <button
                  onClick={copyShareLink}
                  className="flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-800 font-medium px-3 py-1.5 border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {copied ? "Copied!" : "Share link"}
                </button>

                {/* CSV export — only shown when there are results */}
                {hospitals.length > 0 && (
                  <ExportButton hospitals={hospitals} searchQuery={query} />
                )}
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-32 bg-brand-50" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="flex gap-2">
                      <div className="h-5 w-16 bg-gray-100 rounded-full" />
                      <div className="h-5 w-16 bg-gray-100 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && hospitals.length === 0 && (
            <div className="text-center py-20 border border-dashed border-brand-200 rounded-2xl bg-brand-50">
              <svg className="w-10 h-10 text-brand-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-500 font-medium">No hospitals match your search.</p>
              <p className="text-xs text-gray-400 mt-1">Try a different name, city, or adjust the filters.</p>
            </div>
          )}

          {/* Results grid */}
          {!loading && hospitals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hospitals.map((h) => (
                <HospitalCard key={h.id} hospital={h} searchTerm={query} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
