import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Badge from "../ui/Badge";

// Sidebar shown on the home feed page
// Displays trending tags and suggested topics
export default function Sidebar() {
  const [tags, setTags] = useState<any[]>([]);

  useEffect(() => {
    // Fetches all available tags from Supabase
    async function fetchTags() {
      const { data } = await supabase
        .from("tags")
        .select("*")
        .order("name")
        .limit(15);
      if (data) setTags(data);
    }
    fetchTags();
  }, []);

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      {/* Trending topics section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Browse topics
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Link key={tag.id} to={`/tag/${tag.slug}`}>
              <Badge label={tag.name} variant="purple" />
            </Link>
          ))}
        </div>
      </div>

      {/* Platform info */}
      <div className="bg-brand-50 rounded-2xl border border-brand-100 p-5">
        <h3 className="text-sm font-semibold text-brand-900 mb-2">
          Write on Chatter
        </h3>
        <p className="text-xs text-brand-700 mb-3">
          Millions of readers will love to share in your ideas! Start writing today.
        </p>
        <Link
          to="/signup"
          className="block w-full text-center px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Start writing
        </Link>
      </div>
    </aside>
  );
}
