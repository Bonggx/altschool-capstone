import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { formatDate, generateExcerpt } from "../lib/utils";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";

export default function Tag() {
  const { slug } = useParams<{ slug: string }>();
  const [tag, setTag] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchTagAndPosts();
  }, [slug]);

  async function fetchTagAndPosts() {
    setLoading(true);

    // Fetches the tag details
    const { data: tagData } = await supabase
      .from("tags")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!tagData) {
      setLoading(false);
      return;
    }
    setTag(tagData);

    // Fetches all published posts with this tag
    const { data: postTagData } = await supabase
      .from("post_tags")
      .select(
        "posts(*, profiles(id, username, full_name, avatar_url), post_tags(tags(id, name, slug)))",
      )
      .eq("tag_id", tagData.id);

    if (postTagData) {
      const published = postTagData
        .map((pt: any) => pt.posts)
        .filter((p: any) => p && p.status === "published");
      setPosts(published);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tag) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Topic not found
        </h2>
        <Link to="/" className="text-brand-600 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <Badge label={tag.name} variant="purple" />
        <h1 className="text-3xl font-black text-gray-900 mt-3 mb-1">
          {tag.name}
        </h1>
        <p className="text-gray-500 text-sm">{posts.length} published posts</p>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-sm">No posts in this topic yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <article
              key={post.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3 mb-3">
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
                <h2 className="text-lg font-bold text-gray-900 hover:text-brand-600 mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-500 text-sm line-clamp-2">
                  {generateExcerpt(post.content || "")}
                </p>
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
