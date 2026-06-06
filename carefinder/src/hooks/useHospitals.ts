import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { filterHospitals } from "../lib/utils";

// Custom hook that fetches and filters hospitals from Supabase
// Accepts filter parameters and returns filtered results
export function useHospitals(filters: {
  query?: string;
  specialty?: string;
  ownershipType?: string;
  city?: string;
}) {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches all hospitals once on mount
  useEffect(() => {
    fetchHospitals();
  }, []);

  // Re-filter whenever filters change
  useEffect(() => {
    const results = filterHospitals(
      hospitals,
      filters.query || "",
      filters.specialty || "",
      filters.ownershipType || ""
    );
    // Also filter by city if provided
    const cityFiltered = filters.city
      ? results.filter((h) =>
          h.city.toLowerCase().includes(filters.city!.toLowerCase())
        )
      : results;
    setFiltered(cityFiltered);
  }, [hospitals, filters.query, filters.specialty, filters.ownershipType, filters.city]);

  async function fetchHospitals() {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("hospitals")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setHospitals(data ?? []);
      setFiltered(data ?? []);
    }

    setLoading(false);
  }

  return { hospitals: filtered, allHospitals: hospitals, loading, error, refetch: fetchHospitals };
}
