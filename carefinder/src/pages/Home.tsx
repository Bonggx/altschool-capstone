import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import HospitalCard, { Hospital } from "../components/hospital/HospitalCard";
import SearchBar from "../components/hospital/SearchBar";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetches a small set of top-rated hospitals for the featured section
  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from("hospitals")
        .select("*")
        .eq("is_approved", true)
        .order("average_rating", { ascending: false })
        .limit(6);
      if (data) setFeatured(data as Hospital[]);
      setLoading(false);
    }
    fetchFeatured();
  }, []);

  // Redirects to search page with query pre-filled
  function handleSearch(query: string) {
    if (query) navigate(`/search?q=${encodeURIComponent(query)}`);
    else navigate("/search");
  }

  return (
    <div>
      {/* Hero section */}
      <section className="relative bg-gradient-to-br from-brand-50 via-white to-brand-100 py-20 px-4 sm:px-6 overflow-hidden">
        {/* Decorative background blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-200 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-brand-300 rounded-full opacity-10 blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <span className="inline-block text-xs font-semibold text-brand-600 bg-brand-100 px-3 py-1 rounded-full mb-4 tracking-wide uppercase">
            Nigeria's Hospital Directory
          </span>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Find the right care,{" "}
            <span className="text-brand-500">right near you</span>
          </h1>
          <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
            Search thousands of verified hospitals across Nigeria. Filter by specialty, location, and ownership type — then export or share your results.
          </p>

          {/* Hero search bar */}
          <div className="max-w-xl mx-auto">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Quick filter chips */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {["Emergency", "Maternity", "Pediatric", "Dental", "Cardiology"].map((spec) => (
              <Link
                key={spec}
                to={`/search?specialties=${spec}`}
                className="text-xs font-medium text-brand-600 bg-white border border-brand-200 px-3 py-1.5 rounded-full hover:bg-brand-50 transition-colors shadow-sm"
              >
                {spec}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-y border-brand-100 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { value: "2,400+", label: "Hospitals listed" },
            { value: "36", label: "States covered" },
            { value: "120+", label: "LGAs indexed" },
            { value: "Free", label: "CSV export" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-serif text-2xl font-bold text-brand-500">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 sm:px-6 bg-brand-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl font-bold text-gray-900 text-center mb-10">
            How Carefinder works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Search",
                desc: "Enter a hospital name, city, or LGA. Filter by specialty and ownership type.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Export",
                desc: "Download your filtered results as a CSV with the columns you choose.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Share",
                desc: "Copy a shareable link that reproduces your exact search for anyone.",
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                ),
              },
            ].map((item) => (
              <div key={item.step} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-brand-200 shadow-sm flex items-center justify-center text-brand-500">
                  {item.icon}
                </div>
                <span className="text-xs font-bold text-brand-300 tracking-widest">{item.step}</span>
                <h3 className="font-serif text-base font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured hospitals */}
      <section className="py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl font-bold text-gray-900">Top-rated hospitals</h2>
            <Link to="/search" className="text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">
              View all →
            </Link>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-32 bg-brand-50" />
                  <div className="p-5 flex flex-col gap-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featured.map((h) => (
                <HospitalCard key={h.id} hospital={h} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA banner */}
      <section className="py-16 px-4 sm:px-6 bg-gradient-to-r from-brand-500 to-brand-400">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl font-bold text-white mb-3">
            Know a hospital not listed here?
          </h2>
          <p className="text-brand-100 text-sm mb-6">
            Our admin team reviews and approves all submissions. Help us grow the directory.
          </p>
          <Link
            to="/signup"
            className="inline-block bg-white text-brand-600 font-semibold text-sm px-6 py-3 rounded-xl hover:bg-brand-50 transition-colors shadow-md"
          >
            Create an account
          </Link>
        </div>
      </section>
    </div>
  );
}