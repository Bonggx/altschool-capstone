import { Link } from "react-router-dom";
import Badge from "../ui/Badge";
import StarRating from "../ui/StarRating";

// Shows name, address, ownership, specialties, rating, distance

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  lga: string;
  state: string;
  phone?: string;
  email?: string;
  ownership_type: "public" | "private";
  specialties: string[];
  average_rating?: number;
  review_count?: number;
  visiting_hours?: string;
  image_url?: string;
  // Only present when radius search is active
  distance_km?: number;
}

interface HospitalCardProps {
  hospital: Hospital;
  searchTerm?: string;
}

export default function HospitalCard({ hospital, searchTerm }: HospitalCardProps) {
  // Wraps matching characters in a highlight mark
  function highlightMatch(text: string) {
    if (!searchTerm?.trim()) return text;
    const regex = new RegExp(`(${searchTerm.trim()})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-brand-100 text-brand-700 rounded px-0.5">{part}</mark>
      ) : part
    );
  }

  return (
    <Link to={`/hospital/${hospital.id}`} className="block group">
      <article className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-200 overflow-hidden">

        {/* Covers image or pink gradient placeholder */}
        {hospital.image_url ? (
          <div className="h-40 overflow-hidden">
            <img
              src={hospital.image_url}
              alt={hospital.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-brand-50 via-brand-100 to-brand-200 flex items-center justify-center">
            <svg className="w-10 h-10 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        )}

        <div className="p-5">
          {/* Name + ownership type */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h2 className="font-serif text-base font-bold text-gray-900 group-hover:text-brand-600 transition-colors leading-snug">
              {highlightMatch(hospital.name)}
            </h2>
            <Badge
              label={hospital.ownership_type}
              variant={hospital.ownership_type === "public" ? "blue" : "pink"}
            />
          </div>

          {/* Address */}
          <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-brand-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {hospital.address}, {hospital.city}, {hospital.state}
          </p>

          {/* Specialties = max 4 shown, rest counted */}
          {hospital.specialties?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {hospital.specialties.slice(0, 4).map((spec) => (
                <Badge key={spec} label={spec} variant="pink" />

              ))}
              {hospital.specialties.length > 4 && (
                <span className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 rounded-full">
                  +{hospital.specialties.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Rating + distance */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center gap-1.5">
              <StarRating value={hospital.average_rating ?? 0} readonly size="sm" />
              <span className="text-xs text-gray-400">
                {hospital.average_rating
                  ? `${hospital.average_rating.toFixed(1)} (${hospital.review_count ?? 0})`
                  : "No reviews yet"}
              </span>
            </div>
            {hospital.distance_km !== undefined && (
              <span className="flex items-center gap-1 text-xs font-medium text-brand-600 bg-brand-50 px-2 py-1 rounded-full">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {hospital.distance_km.toFixed(1)} km away
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}