import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  formatDate,
  calculateReadingTime,
  generateExcerpt,
  formatNumber,
} from "../lib/utils";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Sidebar from "../components/layout/Sidebar";

function PostCard({ post }: { post: any }) {
  return (
    <article className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/profile/${post.profiles?.username}`}>
          <Avatar
            src={post.profiles?.avatar_url}
            name={post.profiles?.full_name}
            size="sm"
          />
        </Link>
        <div>
          <Link
            to={`/profile/${post.profiles?.username}`}
            className="text-sm font-medium text-gray-900 hover:text-brand-600"
          >
            {post.profiles?.full_name}
          </Link>
          <p className="text-xs text-gray-400">
            {formatDate(post.published_at || post.created_at)}
          </p>
        </div>
      </div>
      <Link to={`/post/${post.slug}`}>
        <h2 className="text-lg font-bold text-gray-900 mb-2 hover:text-brand-600 transition-colors line-clamp-2">
          {post.title}
        </h2>
        <p className="text-gray-500 text-sm line-clamp-3 mb-4">
          {post.excerpt || generateExcerpt(post.content || "")}
        </p>
      </Link>
      {post.cover_image && (
        <Link to={`/post/${post.slug}`}>
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-48 object-cover rounded-xl mb-4"
          />
        </Link>
      )}
      {post.post_tags && post.post_tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.post_tags.map((pt: any) => (
            <Link key={pt.tags?.id} to={`/tag/${pt.tags?.slug}`}>
              <Badge label={pt.tags?.name} variant="purple" />
            </Link>
          ))}
        </div>
      )}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span>{calculateReadingTime(post.content || "")} min read</span>
        <span>{formatNumber(post.view_count)} views</span>
        <span>{formatNumber(post.likes_count)} likes</span>
        <span>{formatNumber(post.comments_count)} comments</span>
      </div>
    </article>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"latest" | "trending">("latest");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [tab]);

  async function fetchPosts() {
    setLoading(true);
    let query = supabase
      .from("posts")
      .select(
        `*, profiles(id, username, full_name, avatar_url), post_tags(tags(id, name, slug))`,
      )
      .eq("status", "published");

    if (tab === "trending") {
      query = query.order("view_count", { ascending: false });
    } else {
      query = query.order("published_at", { ascending: false });
    }

    const { data } = await query.limit(20);
    if (data) setPosts(data);
    setLoading(false);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex gap-8 items-start">
        {/* Main feed */}
        <div className="flex-1 min-w-0">
          {/* Feed header with tabs and mobile topics button */}
          <div className="flex items-center justify-between border-b border-gray-200 mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setTab("latest")}
                className={`pb-3 text-sm font-medium transition-colors ${tab === "latest" ? "text-brand-600 border-b-2 border-brand-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                Latest
              </button>
              <button
                onClick={() => setTab("trending")}
                className={`pb-3 text-sm font-medium transition-colors ${tab === "trending" ? "text-brand-600 border-b-2 border-brand-600" : "text-gray-500 hover:text-gray-700"}`}
              >
                Trending
              </button>
            </div>

            {/* Topics button —> only visible on mobile */}
            <button
              onClick={() => setShowMobileSidebar(!showMobileSidebar)}
              className="lg:hidden pb-3 flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-brand-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              Topics
            </button>
          </div>

          {/* Mobile sidebar drawer */}
          {showMobileSidebar && (
            <div className="lg:hidden mb-6">
              <Sidebar />
            </div>
          )}

          {/* Posts list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-400 text-sm">
                No posts yet. Be the first to write something!
              </p>
              {user && (
                <Link
                  to="/write"
                  className="inline-block mt-4 px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700"
                >
                  Write a post
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar —> hidden on mobile, visible on large screens */}
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar />
        </div>
      </div>
    </main>
  );
}