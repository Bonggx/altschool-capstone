import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import DOMPurify from "dompurify";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { formatDate, calculateReadingTime, formatNumber } from "../lib/utils";
import { createNotification } from "../lib/notifications";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import SignInPrompt from "../components/ui/SignInPrompt";

function Comment({ comment, postId, onReply }: { comment: any; postId: string; onReply: () => void }) {
  const { user } = useAuth();
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitReply = async () => {
    if (!user || !replyText.trim()) return;
    setSubmitting(true);
    await supabase.from("comments").insert({
      post_id: postId,
      author_id: user.id,
      parent_id: comment.id,
      content: replyText.trim(),
    });
    setReplyText("");
    setShowReply(false);
    setSubmitting(false);
    onReply();
  };

  return (
    <div className="flex gap-3">
      <Avatar src={comment.profiles?.avatar_url} name={comment.profiles?.full_name} size="sm" />
      <div className="flex-1">
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">{comment.profiles?.full_name}</p>
          <p className="text-sm text-gray-700 mt-1">{comment.content}</p>
        </div>
        <div className="flex items-center gap-3 mt-1 px-2">
          <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
          {user && !comment.parent_id && (
            <button onClick={() => setShowReply(!showReply)} className="text-xs text-brand-600 hover:underline">
              Reply
            </button>
          )}
        </div>
        {showReply && (
          <div className="mt-2 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply..."
              className="flex-1 px-3 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button size="sm" loading={submitting} onClick={submitReply}>Reply</Button>
          </div>
        )}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 pl-4 border-l-2 border-gray-100">
            {comment.replies.map((reply: any) => (
              <Comment key={reply.id} comment={reply} postId={postId} onReply={onReply} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Post() {
  const { slug } = useParams<{ slug: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [promptMessage, setPromptMessage] = useState("Sign in to continue");

  useEffect(() => {
    if (slug) { fetchPost(); fetchComments(); }
  }, [slug]);

  async function fetchPost() {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select(`*, profiles(id, username, full_name, avatar_url, bio), post_tags(tags(id, name, slug))`)
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (!data) { navigate("/404"); return; }
    setPost(data);

    await supabase.from("analytics_events").insert({ post_id: data.id, viewer_id: user?.id ?? null });
    await supabase.from("posts").update({ view_count: data.view_count + 1 }).eq("id", data.id);

    if (user) {
      const [likeRes, bookmarkRes] = await Promise.all([
        supabase.from("likes").select("id").eq("user_id", user.id).eq("post_id", data.id).limit(1),
        supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("post_id", data.id).limit(1),
      ]);
      setLiked(!!(likeRes.data && likeRes.data.length > 0));
      setBookmarked(!!(bookmarkRes.data && bookmarkRes.data.length > 0));
    }
    setLoading(false);
  }

  async function fetchComments() {
    const postRes = await supabase.from("posts").select("id").eq("slug", slug).single();
    if (!postRes.data) return;
    const { data } = await supabase
      .from("comments")
      .select(`*, profiles(id, username, full_name, avatar_url)`)
      .eq("post_id", postRes.data.id)
      .is("parent_id", null)
      .order("created_at", { ascending: true });

    if (data) {
      const commentsWithReplies = await Promise.all(
        data.map(async (comment) => {
          const { data: replies } = await supabase
            .from("comments")
            .select(`*, profiles(id, username, full_name, avatar_url)`)
            .eq("parent_id", comment.id)
            .order("created_at", { ascending: true });
          return { ...comment, replies: replies ?? [] };
        })
      );
      setComments(commentsWithReplies);
    }
  }

  async function toggleLike() {
    if (!user) {
      setPromptMessage("Sign in to like this post");
      setShowSignInPrompt(true);
      return;
    }
    if (liked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("post_id", post.id);
      await supabase.from("posts").update({ likes_count: post.likes_count - 1 }).eq("id", post.id);
      setPost((p: any) => ({ ...p, likes_count: p.likes_count - 1 }));
    } else {
      await supabase.from("likes").insert({ user_id: user.id, post_id: post.id });
      await supabase.from("posts").update({ likes_count: post.likes_count + 1 }).eq("id", post.id);
      setPost((p: any) => ({ ...p, likes_count: p.likes_count + 1 }));
      await createNotification(post.profiles.id, user.id, "like", post.id);
    }
    setLiked(!liked);
  }

  async function toggleBookmark() {
    if (!user) {
      setPromptMessage("Sign in to bookmark this post");
      setShowSignInPrompt(true);
      return;
    }
    if (bookmarked) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("post_id", post.id);
      await supabase.from("posts").update({ bookmarks_count: (post.bookmarks_count || 1) - 1 }).eq("id", post.id);
      setPost((p: any) => ({ ...p, bookmarks_count: (p.bookmarks_count || 1) - 1 }));
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, post_id: post.id });
      await supabase.from("posts").update({ bookmarks_count: (post.bookmarks_count || 0) + 1 }).eq("id", post.id);
      setPost((p: any) => ({ ...p, bookmarks_count: (p.bookmarks_count || 0) + 1 }));
    }
    setBookmarked(!bookmarked);
  }

  async function submitComment() {
    if (!user) {
      setPromptMessage("Sign in to leave a comment");
      setShowSignInPrompt(true);
      return;
    }
    if (!commentText.trim() || !post) return;
    setSubmittingComment(true);
    await supabase.from("comments").insert({ post_id: post.id, author_id: user.id, content: commentText.trim() });
    await supabase.from("posts").update({ comments_count: post.comments_count + 1 }).eq("id", post.id);
    await createNotification(post.profiles.id, user.id, "comment", post.id);
    setCommentText("");
    setSubmittingComment(false);
    fetchComments();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <>
      <Helmet>
        <title>{post.title} — Chatter</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.cover_image && <meta property="og:image" content={post.cover_image} />}
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
      </Helmet>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <header className="mb-8">
          {post.post_tags && post.post_tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.post_tags.map((pt: any) => (
                <Link key={pt.tags?.id} to={`/tag/${pt.tags?.slug}`}>
                  <Badge label={pt.tags?.name} variant="purple" />
                </Link>
              ))}
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 leading-tight">{post.title}</h1>
          <div className="flex items-center gap-3 mb-4">
            <Link to={`/profile/${post.profiles?.username}`}>
              <Avatar src={post.profiles?.avatar_url} name={post.profiles?.full_name} size="md" />
            </Link>
            <div>
              <Link to={`/profile/${post.profiles?.username}`} className="text-sm font-semibold text-gray-900 hover:text-brand-600">
                {post.profiles?.full_name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{formatDate(post.published_at)}</span>
                <span>·</span>
                <span>{calculateReadingTime(post.content)} min read</span>
                <span>·</span>
                <span>{formatNumber(post.view_count)} views</span>
              </div>
            </div>
          </div>
          {post.cover_image && (
            <img src={post.cover_image} alt={post.title} className="w-full h-64 sm:h-80 object-cover rounded-2xl mb-6" />
          )}
        </header>

        <div className="prose max-w-none mb-10" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />

        <div className="flex items-center gap-4 py-6 border-t border-b border-gray-200 mb-8">
          <button onClick={toggleLike} className="flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105">
            <svg className={`w-6 h-6 transition-colors duration-200 ${liked ? "fill-brand-600 text-brand-600" : "fill-none text-gray-400"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span className={liked ? "text-brand-600" : "text-gray-500"}>{formatNumber(post.likes_count)}</span>
          </button>
          <button onClick={toggleBookmark} className="flex items-center gap-2 text-sm font-medium transition-all duration-200 hover:scale-105">
            <svg className={`w-6 h-6 transition-colors duration-200 ${bookmarked ? "fill-gray-900 text-gray-900" : "fill-none text-gray-400"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span className={bookmarked ? "text-gray-900" : "text-gray-500"}>{formatNumber(post.bookmarks_count || 0)}</span>
          </button>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 mb-10">
          <div className="flex items-center gap-4 mb-3">
            <Avatar src={post.profiles?.avatar_url} name={post.profiles?.full_name} size="lg" />
            <div>
              <Link to={`/profile/${post.profiles?.username}`} className="font-bold text-gray-900 hover:text-brand-600">
                {post.profiles?.full_name}
              </Link>
              <p className="text-xs text-gray-400">@{post.profiles?.username}</p>
            </div>
          </div>
          {post.profiles?.bio && <p className="text-sm text-gray-600">{post.profiles.bio}</p>}
        </div>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-6">Comments ({formatNumber(post.comments_count)})</h2>
          {user ? (
            <div className="flex gap-3 mb-8">
              <Avatar src={profile?.avatar_url} name={profile?.full_name} size="sm" />
              <div className="flex-1 flex flex-col gap-2">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="w-full px-4 py-3 text-sm text-gray-900 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <div className="flex justify-end">
                  <Button size="sm" loading={submittingComment} onClick={submitComment}>Post comment</Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 mb-8 text-center">
              <p className="text-sm text-gray-500 mb-2">Sign in to leave a comment</p>
              <Button size="sm" variant="outline" onClick={() => { setPromptMessage("Sign in to comment"); setShowSignInPrompt(true); }}>
                Sign in
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-6">
            {comments.map((comment) => (
              <Comment key={comment.id} comment={comment} postId={post.id} onReply={fetchComments} />
            ))}
          </div>
        </section>
      </main>

      {/* Sign in prompt popup */}
      <SignInPrompt
        isOpen={showSignInPrompt}
        onClose={() => setShowSignInPrompt(false)}
        message={promptMessage}
      />
    </>
  );
}
