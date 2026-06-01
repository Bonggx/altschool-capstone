import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { createNotification } from "../lib/notifications";
import { timeAgo } from "../lib/utils";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingBack, setFollowingBack] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user) { navigate("/signin"); return; }
    fetchNotifications();
  }, [user]);

  async function fetchNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(id, username, full_name, avatar_url),
        posts(id, title, slug)
      `)
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);

      // Check which follow notification actors the current user already follows back
      const followNotifs = data.filter((n) => n.type === "follow");
      if (followNotifs.length > 0) {
        const actorIds = followNotifs.map((n) => n.actor_id);
        const { data: existingFollows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user!.id)
          .in("following_id", actorIds);

        const followingMap: Record<string, boolean> = {};
        existingFollows?.forEach((f) => { followingMap[f.following_id] = true; });
        setFollowingBack(followingMap);
      }
    }

    setLoading(false);

    // Mark all notifications as read
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user!.id)
      .eq("read", false);
  }

  async function handleFollowBack(actorId: string) {
    if (!user) return;
    await supabase.from("follows").insert({ follower_id: user.id, following_id: actorId });
    await createNotification(actorId, user.id, "follow");
    setFollowingBack((prev) => ({ ...prev, [actorId]: true }));
  }

  function getNotificationText(n: any) {
    switch (n.type) {
      case "like": return "liked your post";
      case "comment": return "commented on your post";
      case "follow": return "started following you";
      default: return "interacted with you";
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-black text-gray-900 mb-6">Notifications</h1>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <p className="text-gray-400 text-sm">No notifications yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                !n.read ? "bg-brand-50 border-brand-100" : "bg-white border-gray-200"
              }`}
            >
              <Link to={`/profile/${n.actor?.username}`}>
                <Avatar src={n.actor?.avatar_url} name={n.actor?.full_name} size="md" />
              </Link>

              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? "font-bold text-gray-900" : "font-normal text-gray-600"}`}>
                  <Link to={`/profile/${n.actor?.username}`} className="hover:text-brand-600">
                    {n.actor?.full_name}
                  </Link>
                  {" "}{getNotificationText(n)}
                  {n.posts && (
                    <>
                      {" — "}
                      <Link to={`/post/${n.posts?.slug}`} className="hover:text-brand-600 underline">
                        {n.posts?.title}
                      </Link>
                    </>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
              </div>

              {/* Follow back button — only on follow notifications */}
              {n.type === "follow" && (
                followingBack[n.actor_id] ? (
                  <span className="text-xs text-gray-400 flex-shrink-0">Following</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleFollowBack(n.actor_id)}
                    className="flex-shrink-0"
                  >
                    Follow back
                  </Button>
                )
              )}

              {!n.read && (
                <div className="w-2 h-2 bg-brand-600 rounded-full flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
