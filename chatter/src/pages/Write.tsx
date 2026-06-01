import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { slugify, calculateReadingTime, generateExcerpt, stripHtml } from "../lib/utils";
import Editor from "../components/editor/Editor";
import Button from "../components/ui/Button";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

async function directPost(table: string, data: any, token?: string) {
  const headers: any = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST", headers, body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed");
  return Array.isArray(result) ? result[0] : result;
}

async function directPatch(table: string, id: string, data: any, token?: string) {
  const headers: any = {
    "apikey": SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: "PATCH", headers, body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Failed");
  return Array.isArray(result) ? result[0] : result;
}

export default function Write() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [postId, setPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const draftsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/signin");
  }, [user, loading, navigate]);

  useEffect(() => {
    async function fetchTags() {
      const { data } = await supabase.from("tags").select("*").order("name");
      if (data) setAvailableTags(data);
    }
    fetchTags();
    if (user) fetchDrafts();
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (draftsRef.current && !draftsRef.current.contains(e.target as Node)) {
        setShowDrafts(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autosave every 2 minutes
  useEffect(() => {
    if (!title && !content) return;
    const interval = setInterval(() => saveDraft(false), 120000);
    return () => clearInterval(interval);
  }, [title, content, selectedTags, postId]);

  async function fetchDrafts() {
    const { data } = await supabase
      .from("posts")
      .select("id, title, content, updated_at")
      .eq("author_id", user!.id)
      .eq("status", "draft")
      .order("updated_at", { ascending: false });
    if (data) setDrafts(data);
  }

  async function loadDraft(draft: any) {
    // Load the full draft into the editor including content
    setTitle(draft.title || "");
    setContent(draft.content || "");
    setPostId(draft.id);
    setShowDrafts(false);
    setSavedAt("Loaded from draft");

    // Fetch tags for this draft
    const { data: tagData } = await supabase
      .from("post_tags")
      .select("tag_id")
      .eq("post_id", draft.id);
    if (tagData) setSelectedTags(tagData.map((t: any) => t.tag_id));
  }

  const saveDraft = useCallback(async (showLoader = true) => {
    if (!user || !title.trim()) return;
    if (showLoader) setSaving(true);

    const token = session?.access_token;
    const postData = {
      title: title.trim(),
      // Include slug only on new posts
      ...(postId ? {} : { slug: slugify(title) + "-draft-" + Date.now() }),
      content,
      excerpt: generateExcerpt(stripHtml(content)),
      reading_time: calculateReadingTime(stripHtml(content)),
      status: "draft",
      author_id: user.id,
      updated_at: new Date().toISOString(),
    };

    try {
      if (postId) {
        // Update existing draft — includes content
        await directPatch("posts", postId, {
          title: title.trim(),
          content,
          excerpt: generateExcerpt(stripHtml(content)),
          reading_time: calculateReadingTime(stripHtml(content)),
          updated_at: new Date().toISOString(),
        }, token);
      } else {
        // Create new draft
        const saved = await directPost("posts", postData, token);
        if (saved?.id) setPostId(saved.id);
      }
      setSavedAt(new Date().toLocaleTimeString());
      fetchDrafts();
    } catch (err) {
      console.error("Draft save failed:", err);
    }

    if (showLoader) setSaving(false);
  }, [user, session, title, content, postId]);

  const publishPost = async () => {
    setError(null);
    setSuccess(null);
    if (!user) { setError("You must be signed in to publish."); return; }
    if (!title.trim()) { setError("Please add a title."); return; }
    const plainText = stripHtml(content);
    if (plainText.trim().length < 10) { setError("Please add some content."); return; }

    setPublishing(true);
    try {
      const token = session?.access_token;
      const slug = slugify(title) + "-" + Date.now();
      const postData = {
        title: title.trim(),
        slug,
        content,
        excerpt: generateExcerpt(plainText),
        reading_time: calculateReadingTime(plainText),
        status: "published",
        author_id: user.id,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let savedPostId = postId;

      if (postId) {
        await directPatch("posts", postId, postData, token);
      } else {
        const post = await directPost("posts", postData, token);
        if (post?.id) savedPostId = post.id;
      }

      if (savedPostId && selectedTags.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/post_tags`, {
          method: "POST",
          headers: {
            "apikey": SUPABASE_ANON_KEY,
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(selectedTags.map((tagId) => ({
            post_id: savedPostId,
            tag_id: tagId,
          }))),
        });
      }

      setDrafts((prev) => prev.filter((d) => d.id !== postId));
      setSuccess("Published! Redirecting...");
      setTimeout(() => navigate(`/post/${slug}`), 1000);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    }
    setPublishing(false);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : prev.length < 5 ? [...prev, tagId] : prev
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">New post</h1>
          {savedAt && <span className="text-xs text-gray-400">Saved {savedAt}</span>}
        </div>
        <div className="flex items-center gap-2">
          {/* Drafts dropdown */}
          <div className="relative" ref={draftsRef}>
            <Button variant="ghost" size="sm" onClick={() => setShowDrafts(!showDrafts)}>
              {drafts.length > 0 ? `${drafts.length} draft${drafts.length > 1 ? "s" : ""}` : "Drafts"}
              <svg className="w-3 h-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            {showDrafts && (
              <div className="absolute left-0 mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-lg py-1 z-50">
                {drafts.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">No drafts yet</p>
                ) : (
                  drafts.map((draft) => (
                    <button
                      key={draft.id}
                      onClick={() => loadDraft(draft)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {draft.title || "Untitled draft"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Last saved {new Date(draft.updated_at).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <Button variant="secondary" size="sm" loading={saving} onClick={() => saveDraft(true)}>
            Save draft
          </Button>
          <Button size="sm" loading={publishing} onClick={publishPost}>
            Publish
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</p>}
      {success && <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4">{success}</p>}

      <input
        type="text"
        placeholder="Your post title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full text-3xl font-black text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent mb-6"
      />

      <Editor content={content} onChange={setContent} placeholder="Tell your story..." />

      <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Add tags</h3>
        <p className="text-xs text-gray-400 mb-3">Select up to 5 tags.</p>
        <div className="flex flex-wrap gap-2">
          {availableTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedTags.includes(tag.id)
                  ? "bg-brand-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
