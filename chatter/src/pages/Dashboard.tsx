import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatNumber } from "../lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import Avatar from "../components/ui/Avatar";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { profileSchema, ProfileData } from "../lib/validations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// Tab type for the dashboard navigation
type Tab = "posts" | "analytics" | "profile" | "bookmarks";

export default function Dashboard() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Profile form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile?.full_name ?? "",
      bio: profile?.bio ?? "",
      website: profile?.website ?? "",
      twitter: profile?.twitter ?? "",
      github: profile?.github ?? "",
    },
  });

  // Redirects to sign in if not authenticated
  useEffect(() => {
    if (!user) navigate("/signin");
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchBookmarks();
      fetchAnalytics();
    }
  }, [user]);

  async function fetchPosts() {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select(`*, post_tags(tags(id, name, slug))`)
      .eq("author_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setPosts(data);
    setLoading(false);
  }

  async function fetchBookmarks() {
    const { data } = await supabase
      .from("bookmarks")
      .select(
        `*, posts(id, title, slug, excerpt, published_at, profiles(full_name, username))`,
      )
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setBookmarks(data);
  }

  async function fetchAnalytics() {
    // Fetches all analytics events for the user's posts
    const { data: events } = await supabase
      .from("analytics_events")
      .select(`*, posts!inner(author_id, title)`)
      .eq("posts.author_id", user!.id)
      .order("viewed_at", { ascending: true });

    if (!events) return;

    // Groups views by date for the chart
    const viewsByDate = events.reduce((acc: any, event: any) => {
      const date = new Date(event.viewed_at).toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Groups views by post title
    const viewsByPost = events.reduce((acc: any, event: any) => {
      const title = event.posts?.title ?? "Unknown";
      acc[title] = (acc[title] || 0) + 1;
      return acc;
    }, {});

    setAnalytics({
      totalViews: events.length,
      viewsByDate: Object.entries(viewsByDate).map(([date, views]) => ({
        date,
        views,
      })),
      viewsByPost: Object.entries(viewsByPost)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([title, views]) => ({
          title: title.substring(0, 20) + "...",
          views,
        })),
    });
  }

  async function deletePost(postId: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setAvatarUploading(true);
    const fileName = `${user.id}-${Date.now()}`;
    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });
    if (!error && data) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(data.path);
      await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      await refreshProfile();
    }
    setAvatarUploading(false);
  }

  async function onSaveProfile(data: ProfileData) {
    if (!user) return;
    setSavingProfile(true);
    await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        bio: data.bio,
        website: data.website,
        twitter: data.twitter,
        github: data.github,
      })
      .eq("id", user.id);
    await refreshProfile();
    setSavingProfile(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "posts", label: "My Posts" },
    { key: "analytics", label: "Analytics" },
    { key: "bookmarks", label: "Bookmarks" },
    { key: "profile", label: "Edit Profile" },
  ];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Dashboard header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, {profile?.full_name}
          </p>
        </div>
        <Link to="/write">
          <Button size="sm">Write new post</Button>
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-gray-200 mb-8">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "text-brand-600 border-b-2 border-brand-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Posts tab */}
      {tab === "posts" && (
        <div>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-400 text-sm mb-4">
                You have not written anything yet.
              </p>
              <Link to="/write">
                <Button size="sm">Write your first post</Button>
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl border border-gray-200 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900 truncate">
                          {post.title}
                        </h3>
                        <Badge
                          label={post.status}
                          variant={
                            post.status === "published"
                              ? "green"
                              : post.status === "archived"
                                ? "gray"
                                : "yellow"
                          }
                        />
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        {formatDate(post.created_at)}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {post.post_tags?.map((pt: any) => (
                          <Badge
                            key={pt.tags?.id}
                            label={pt.tags?.name}
                            variant="purple"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link to={`/post/${post.slug}`}>
                        <Button size="sm" variant="ghost">
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deletePost(post.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics tab */}
      {tab === "analytics" && (
        <div className="flex flex-col gap-6">
          {/* Summary card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500 mb-1">Total views</p>
            <p className="text-4xl font-black text-brand-600">
              {analytics ? formatNumber(analytics.totalViews) : "0"}
            </p>
          </div>

          {/* Views over time chart */}
          {analytics?.viewsByDate?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Views over time
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={analytics.viewsByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#db2777"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top posts chart */}
          {analytics?.viewsByPost?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                Top posts by views
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.viewsByPost} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    dataKey="title"
                    type="category"
                    tick={{ fontSize: 10 }}
                    width={100}
                  />
                  <Tooltip />
                  <Bar dataKey="views" fill="#db2777" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Bookmarks tab */}
      {tab === "bookmarks" && (
        <div className="flex flex-col gap-4">
          {bookmarks.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-400 text-sm">No bookmarks yet.</p>
            </div>
          ) : (
            bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white rounded-2xl border border-gray-200 p-5"
              >
                <Link to={`/post/${bookmark.posts?.slug}`}>
                  <h3 className="font-bold text-gray-900 hover:text-brand-600 mb-1">
                    {bookmark.posts?.title}
                  </h3>
                </Link>
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                  {bookmark.posts?.excerpt}
                </p>
                <p className="text-xs text-gray-400">
                  By {bookmark.posts?.profiles?.full_name} ·{" "}
                  {formatDate(bookmark.posts?.published_at)}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit profile tab */}
      {tab === "profile" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">
            Edit your profile
          </h2>

          {/* Avatar upload */}
          <div className="flex items-center gap-4 mb-6">
            <Avatar
              src={profile?.avatar_url}
              name={profile?.full_name}
              size="xl"
            />
            <div>
              <label className="cursor-pointer px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                {avatarUploading ? "Uploading..." : "Change photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
              <p className="text-xs text-gray-400 mt-1">JPG or PNG, max 2MB</p>
            </div>
          </div>

          {/* Profile form */}
          <form
            onSubmit={handleSubmit(onSaveProfile)}
            className="flex flex-col gap-4"
          >
            <Input
              label="Full name"
              error={errors.fullName?.message}
              {...register("fullName")}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Bio</label>
              <textarea
                {...register("bio")}
                rows={3}
                placeholder="Tell readers about yourself..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
              {errors.bio && (
                <p className="text-xs text-red-600">{errors.bio.message}</p>
              )}
            </div>
            <Input
              label="Website"
              placeholder="https://yoursite.com"
              error={errors.website?.message}
              {...register("website")}
            />
            <Input
              label="Twitter"
              placeholder="@username"
              error={errors.twitter?.message}
              {...register("twitter")}
            />
            <Input
              label="GitHub"
              placeholder="username"
              error={errors.github?.message}
              {...register("github")}
            />

            <div className="flex items-center gap-3">
              <Button type="submit" loading={savingProfile}>
                Save changes
              </Button>
              {profileSaved && (
                <p className="text-sm text-green-600">Profile saved!</p>
              )}
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
