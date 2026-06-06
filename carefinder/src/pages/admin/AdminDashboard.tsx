import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

export default function AdminDashboard() {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, reviews: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"hospitals" | "reviews">("hospitals");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);

    // Fetches all hospitals regardless of approval status
    const { data: hospitalData } = await supabase
      .from("hospitals")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetches reviews pending moderation
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*, profiles(full_name), hospitals(name)")
      .order("created_at", { ascending: false });

    if (hospitalData) {
      setHospitals(hospitalData);
      setStats({
        total: hospitalData.length,
        approved: hospitalData.filter((h) => h.is_approved).length,
        pending: hospitalData.filter((h) => !h.is_approved).length,
        reviews: reviewData?.length ?? 0,
      });
    }

    if (reviewData) setReviews(reviewData);
    setLoading(false);
  }

  // Toggles hospital approval status
  async function toggleApproval(id: string, current: boolean) {
    await supabase.from("hospitals").update({ is_approved: !current }).eq("id", id);
    setHospitals((prev) =>
      prev.map((h) => (h.id === id ? { ...h, is_approved: !current } : h))
    );
    setStats((s) => ({
      ...s,
      approved: current ? s.approved - 1 : s.approved + 1,
      pending: current ? s.pending + 1 : s.pending - 1,
    }));
  }

  // Toggles review visibility
  async function toggleReview(id: string, current: boolean) {
    await supabase.from("reviews").update({ is_approved: !current }).eq("id", id);
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_approved: !current } : r))
    );
  }

  async function deleteHospital(id: string) {
    if (!confirm("Delete this hospital? This cannot be undone.")) return;
    await supabase.from("hospitals").delete().eq("id", id);
    setHospitals((prev) => prev.filter((h) => h.id !== id));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage hospital listings and moderate reviews.</p>
        </div>
        <Link to="/admin/hospitals/new">
          <Button size="md">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Hospital
          </Button>
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total hospitals", value: stats.total, color: "text-gray-900" },
          { label: "Approved", value: stats.approved, color: "text-green-600" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          { label: "Reviews", value: stats.reviews, color: "text-brand-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
            <p className={`font-serif text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {(["hospitals", "reviews"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "text-brand-600 border-b-2 border-brand-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Hospitals table */}
      {tab === "hospitals" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-600">Hospital</th>
                <th className="px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Location</th>
                <th className="px-5 py-3 font-semibold text-gray-600 hidden md:table-cell">Type</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {hospitals.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{h.name}</td>
                  <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">{h.city}, {h.state}</td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <Badge label={h.ownership_type} variant={h.ownership_type === "public" ? "blue" : "pink"} />
                  </td>
                  <td className="px-5 py-4">
                    <Badge label={h.is_approved ? "Approved" : "Pending"} variant={h.is_approved ? "green" : "yellow"} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/admin/hospitals/${h.id}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleApproval(h.id, h.is_approved)}
                      >
                        {h.is_approved ? "Unpublish" : "Approve"}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => deleteHospital(h.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hospitals.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-12">No hospitals yet.</p>
          )}
        </div>
      )}

      {/* Reviews table */}
      {tab === "reviews" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 text-left">
              <tr>
                <th className="px-5 py-3 font-semibold text-gray-600">Reviewer</th>
                <th className="px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Hospital</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Rating</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Status</th>
                <th className="px-5 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reviews.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{r.profiles?.full_name ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-500 hidden sm:table-cell">{r.hospitals?.name ?? "—"}</td>
                  <td className="px-5 py-4 text-gray-700">{"★".repeat(r.rating)}</td>
                  <td className="px-5 py-4">
                    <Badge label={r.is_approved ? "Visible" : "Hidden"} variant={r.is_approved ? "green" : "gray"} />
                  </td>
                  <td className="px-5 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleReview(r.id, r.is_approved)}
                    >
                      {r.is_approved ? "Hide" : "Show"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reviews.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-12">No reviews yet.</p>
          )}
        </div>
      )}
    </div>
  );
}