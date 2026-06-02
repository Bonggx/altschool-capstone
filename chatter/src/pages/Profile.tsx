import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatNumber, generateExcerpt } from "../lib/utils";
import { createNotification } from "../lib/notifications";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [following, setFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (username) fetchProfile();
  }, [username]);

  async function fetchProfile() {
    setLoading(true);
    const { data: profileData } = await supabase
      .from("profiles").select("*").eq("username", username).single();

    if (!profileData) { setLoading(false); return; }
    setProfile(profileData);

    const { data: postsData } = await supabase
      .from("posts")
      .select(`*, post_tags(tags(id, name, slug))`)
      .eq("author_id", profileData.id)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (postsData) setPosts(postsData);

    if (user) {
      const { data: followData } = await supabase
        .from("follows").select("follower_id")
        .eq("follower_id", user.id).eq("following_id", profileData.id).limit(1);
      setFollowing(!!(followData && followData.length > 0));

      const { data: followsBackData } = await supabase
        .from("follows").select("follower_id")
        .eq("follower_id", profileData.id).eq("following_id", user.id).limit(1);
      setFollowsMe(!!(followsBackData && followsBackData.length > 0));
    }

    setLoading(false);
  }

  async function fetchFollowers() {
    const { data } = await supabase
      .from("follows")
      .select("follower:profiles!follows_follower_id_fkey(id, username, full_name, avatar_url)")
      .eq("following_id", profile.id);
    if (data) setFollowersList(data.map((d: any) => d.follower));
    setShowFollowers(true);
  }

  async function fetchFollowing() {
    const { data } = await supabase
      .from("follows")
      .select("following:profiles!follows_following_id_fkey(id, username, full_name, avatar_url)")
      .eq("follower_id", profile.id);
    if (data) setFollowingList(data.map((d: any) => d.following));
    setShowFollowing(true);
  }

  async function toggleFollow() {
    if (!user || !profile) return;
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
      setProfile((p: any) => ({ ...p, follower_count: Math.max(0, p.follower_count - 1) }));
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      setProfile((p: any) => ({ ...p, follower_count: p.follower_count + 1 }));
      await createNotification(profile.id, user.id, "follow");
    }
    setFollowing(!following);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">User not found</h2>
        <p className="text-gray-500 mb-6">This profile does not exist.</p>
        <Link to="/"><Button>Back to home</Button></Link>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  const followButtonLabel = following ? "Unfollow" : followsMe ? "Follow back" : "Follow";

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar src={profile.avatar_url} name={profile.full_name} size="xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-900">{profile.full_name}</h1>
            <p className="text-gray-400 text-sm mb-2">@{profile.username}</p>
            {profile.bio && <p className="text-gray-600 text-sm mb-3">{profile.bio}</p>}
            <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
              {/* Clickable followers count */}
              <button onClick={fetchFollowers} className="hover:text-brand-600 transition-colors">
                <strong className="text-gray-900">{formatNumber(profile.follower_count ?? 0)}</strong> followers
              </button>
              {/* Clickable following count */}
              <button onClick={fetchFollowing} className="hover:text-brand-600 transition-colors">
                <strong className="text-gray-900">{formatNumber(profile.following_count ?? 0)}</strong> following
              </button>
              <span><strong className="text-gray-900">{posts.length}</strong> posts</span>
            </div>
          </div>

          {isOwnProfile ? (
            <Link to="/dashboard">
              <Button variant="secondary" size="sm">Edit profile</Button>
            </Link>
          ) : user ? (
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant={following ? "secondary" : "primary"} size="sm" onClick={toggleFollow}>
                {followButtonLabel}
              </Button>
              {following && (
                <Link to={`/messages?to=${profile.id}`}>
                  <Button variant="secondary" size="sm">Message</Button>
                </Link>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-4">Posts</h2>
      {posts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-sm">No posts published yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <article key={post.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <Link to={`/post/${post.slug}`}>
                <h3 className="text-lg font-bold text-gray-900 hover:text-brand-600 mb-2">{post.title}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{generateExcerpt(post.content || "")}</p>
              </Link>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {post.post_tags?.map((pt: any) => (
                    <Badge key={pt.tags?.id} label={pt.tags?.name} variant="purple" />
                  ))}
                </div>
                <span className="text-xs text-gray-400">{formatDate(post.published_at)}</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Followers modal */}
      <Modal isOpen={showFollowers} onClose={() => setShowFollowers(false)} title="Followers">
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
          {followersList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No followers yet</p>
          ) : (
            followersList.map((u) => (
              <Link key={u.id} to={`/profile/${u.username}`} onClick={() => setShowFollowers(false)} className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 transition-colors">
                <Avatar src={u.avatar_url} name={u.full_name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{u.full_name}</p>
                  <p className="text-xs text-gray-400">@{u.username}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </Modal>

      {/* Following modal */}
      <Modal isOpen={showFollowing} onClose={() => setShowFollowing(false)} title="Following">
        <div className="flex flex-col gap-3 max-h-80 overflow-y-auto">
          {followingList.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Not following anyone yet</p>
          ) : (
            followingList.map((u) => (
              <Link key={u.id} to={`/profile/${u.username}`} onClick={() => setShowFollowing(false)} className="flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 transition-colors">
                <Avatar src={u.avatar_url} name={u.full_name} size="md" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{u.full_name}</p>
                  <p className="text-xs text-gray-400">@{u.username}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </Modal>
    </main>
  );
}
