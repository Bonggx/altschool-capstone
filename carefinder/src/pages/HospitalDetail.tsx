import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { formatDate } from "../lib/utils";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import StarRating from "../components/ui/StarRating";

export default function HospitalDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [hospital, setHospital] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  // Tracks whether the current user already left a review
  const [userReview, setUserReview] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetchHospital();
      fetchReviews();
      recordView();
    }
  }, [id]);

  async function fetchHospital() {
    const { data } = await supabase
      .from("hospitals")
      .select("*")
      .eq("id", id)
      .single();
    if (data) setHospital(data);
    setLoading(false);
  }

  async function fetchReviews() {
    const { data } = await supabase
      .from("reviews")
      .select("*, profiles(full_name, avatar_url)")
      .eq("hospital_id", id)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    if (data) {
      setReviews(data);
      // Checks if logged-in user already has a review here
      if (user) {
        const mine = data.find((r: any) => r.user_id === user.id);
        if (mine) setUserReview(mine);
      }
    }
  }

  // Fires an analytics event to the analytics_events table on each view
  async function recordView() {
    await supabase.from("analytics_events").insert({
      hospital_id: id,
      event_type: "view",
    });
  }

  async function submitReview() {
    if (!user) return;
    if (reviewRating === 0) { setReviewError("Please select a star rating."); return; }
    setReviewError(null);
    setSubmitting(true);

    const { error } = await supabase.from("reviews").insert({
      hospital_id: id,
      user_id: user.id,
      rating: reviewRating,
      body: reviewText.trim() || null,
    });

    if (error) {
      setReviewError(error.message);
    } else {
      setReviewText("");
      setReviewRating(0);
      fetchReviews(); // refreshes the list
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!hospital) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">Hospital not found</h2>
        <p className="text-gray-500 text-sm mb-6">This listing may have been removed.</p>
        <Link to="/search"><Button>Back to search</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

      {/* Back link */}
      <Link to="/search" className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-800 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to search
      </Link>

      {/* Cover image or gradient placeholder */}
      {hospital.image_url ? (
        <img
          src={hospital.image_url}
          alt={hospital.name}
          className="w-full h-56 object-cover rounded-2xl mb-6"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-brand-100 to-brand-200 rounded-2xl mb-6 flex items-center justify-center">
          <svg className="w-14 h-14 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="font-serif text-3xl font-bold text-gray-900">{hospital.name}</h1>
            <Badge
              label={hospital.ownership_type}
              variant={hospital.ownership_type === "public" ? "blue" : "pink"}
            />
          </div>
          <p className="text-sm text-gray-400 flex items-center gap-1">
            <svg className="w-4 h-4 text-brand-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {hospital.address}, {hospital.city}, {hospital.lga}, {hospital.state}
          </p>
        </div>

        {/* Aggregate rating summary */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <StarRating value={hospital.average_rating ?? 0} readonly size="md" />
          <span className="text-sm text-gray-500">
            {hospital.average_rating
              ? `${Number(hospital.average_rating).toFixed(1)} (${hospital.review_count ?? 0} reviews)`
              : "No reviews yet"}
          </span>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">

        {/* Contact */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="font-serif text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest">Contact</h2>
          <ul className="flex flex-col gap-2 text-sm text-gray-600">
            {hospital.phone && (
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${hospital.phone}`} className="hover:text-brand-600 transition-colors">{hospital.phone}</a>
              </li>
            )}
            {hospital.email && (
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${hospital.email}`} className="hover:text-brand-600 transition-colors">{hospital.email}</a>
              </li>
            )}
            {hospital.visiting_hours && (
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {hospital.visiting_hours}
              </li>
            )}
          </ul>
        </div>

        {/* Specialties */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h2 className="font-serif text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest">Specialties</h2>
          {hospital.specialties?.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {hospital.specialties.map((s: string) => (
                <Badge key={s} label={s} variant="pink" />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No specialties listed.</p>
          )}
        </div>
      </div>

      {/* Description (rendered from Markdown stored as plain text) */}
      {hospital.description && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-8">
          <h2 className="font-serif text-sm font-bold text-gray-700 mb-3 uppercase tracking-widest">About</h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{hospital.description}</p>
        </div>
      )}

      {/* Reviews section */}
      <div>
        <h2 className="font-serif text-xl font-bold text-gray-900 mb-5">Reviews</h2>

        {/* Leave a review = only shown to logged-in users who haven't reviewed yet */}
        {user && !userReview && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Leave a review</p>
            <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience (optional)..."
              rows={3}
              className="w-full mt-3 text-sm text-gray-700 placeholder-gray-400 border border-brand-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-200 bg-white resize-none"
            />
            {reviewError && (
              <p className="text-xs text-red-500 mt-1">{reviewError}</p>
            )}
            <div className="flex justify-end mt-3">
              <Button size="sm" loading={submitting} onClick={submitReview}>
                Submit review
              </Button>
            </div>
          </div>
        )}

        {/* Prompt guests to sign in before reviewing */}
        {!user && (
          <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-6 text-center">
            <p className="text-sm text-gray-500 mb-3">Sign in to leave a review.</p>
            <Link to="/signin"><Button variant="outline" size="sm">Sign in</Button></Link>
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">No reviews yet. Be the first!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Reviewer avatar initial */}
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-300 to-brand-500 flex items-center justify-center text-white text-xs font-bold">
                      {r.profiles?.full_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-sm font-medium text-gray-800">
                      {r.profiles?.full_name ?? "Anonymous"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                </div>
                <StarRating value={r.rating} readonly size="sm" />
                {r.body && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.body}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}