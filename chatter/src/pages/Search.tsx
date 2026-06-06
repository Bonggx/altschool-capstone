import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatDate, generateExcerpt, calculateReadingTime } from "../lib/utils";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  // Toggles between searching posts and searching users
  const [tab, setTab] = useState<"posts" | "people">("posts");

  useEffect(() => {
    if (query.trim()) fetchResults();
  }, [query]);

  async function fetchResults() {
    setLoading(true);

    // Searches posts by title or content
    const { data: postData } = await supabase
      .from("posts")
      .select(`*, profiles(id, username, full_name, avatar_url), post_tags(tags(id, name, slug))`)
      .eq("status", "published")
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order("published_at", { ascending: false })
      .limit(20);

    // Searches users by full name or username
    const { data: userData } = await supabase
      .from("profiles")
      .select("*")
      .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(20);

    if (postData) setPosts(postData);
    if (userData) setUsers(userData);
    setLoading(false);
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-1">
          {query ? `Results for "${query}"` : "Search"}
        </h1>
      </div>

      {/* Tab switcher between posts and people */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setTab("posts")}
          className={`pb-3 text-sm font-medium transition-colors ${tab === "posts" ? "text-brand-600 border-b-2 border-brand-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          Posts {!loading && query && `(${posts.length})`}
        </button>
        <button
          onClick={() => setTab("people")}
          className={`pb-3 text-sm font-medium transition-colors ${tab === "people" ? "text-brand-600 border-b-2 border-brand-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          People {!loading && query && `(${users.length})`}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Posts tab */}
          {tab === "posts" && (
            <div className="flex flex-col gap-4">
              {posts.length === 0 && query ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-400 text-sm">No posts found for "{query}"</p>
                </div>
              ) : (
                posts.map((post) => (
                  <article key={post.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <Link to={`/profile/${post.profiles?.username}`}>
                        <Avatar src={post.profiles?.avatar_url} name={post.profiles?.full_name} size="sm" />
                      </Link>
                      <div>
                        <Link to={`/profile/${post.profiles?.username}`} className="text-sm font-medium text-gray-900 hover:text-brand-600">
                          {post.profiles?.full_name}
                        </Link>
                        <p className="text-xs text-gray-400">{formatDate(post.published_at)}</p>
                      </div>
                    </div>
                    <Link to={`/post/${post.slug}`}>
                      <h2 className="text-lg font-bold text-gray-900 hover:text-brand-600 mb-2">{post.title}</h2>
                      <p className="text-gray-500 text-sm line-clamp-2 mb-3">{generateExcerpt(post.content || "")}</p>
                    </Link>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {post.post_tags?.map((pt: any) => (
                          <Link key={pt.tags?.id} to={`/tag/${pt.tags?.slug}`}>
                            <Badge label={pt.tags?.name} variant="purple" />
                          </Link>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{calculateReadingTime(post.content || "")} min read</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {/* People tab */}
          {tab === "people" && (
            <div className="flex flex-col gap-4">
              {users.length === 0 && query ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <p className="text-gray-400 text-sm">No people found for "{query}"</p>
                </div>
              ) : (
                users.map((u) => (
                  <Link
                    key={u.id}
                    to={`/profile/${u.username}`}
                    className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    {/* User avatar with initial fallback */}
                    <Avatar src={u.avatar_url} name={u.full_name} size="lg" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 hover:text-brand-600">{u.full_name}</p>
                      <p className="text-sm text-gray-400">@{u.username}</p>
                      {u.bio && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{u.bio}</p>}
                    </div>
                    {/* Follower count on the right */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900">{u.follower_count ?? 0}</p>
                      <p className="text-xs text-gray-400">followers</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}
