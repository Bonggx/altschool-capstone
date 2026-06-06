import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Redirect() {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);
  const link = useQuery(api.links.getLinkBySlug, { slug: slug ?? "" });

  useEffect(() => {
    if (link === undefined) return;
    if (link === null) { setError("This link doesn't exist."); return; }
    if (!link.isActive) { setError("This link is no longer active."); return; }
    if (link.expiresAt && Date.now() > link.expiresAt) { setError("This link has expired."); return; }
    window.location.href = link.originalUrl;
  }, [link]);

  if (link === undefined && !error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">Redirecting you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Unavailable</h1>
        <p className="text-gray-500 mb-6">{error}</p>
        <a href="/" className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors">
          Create a new link
        </a>
      </div>
    );
  }

  return null;
}
