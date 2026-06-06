import { supabase } from "./supabase";

// Creates a notification for a user when someone likes, comments, or follows them
// userId = person receiving the notification
// actorId = person who performed the action
export async function createNotification(
  userId: string,
  actorId: string,
  type: "like" | "comment" | "follow",
  postId?: string
) {
  // Never send a notification about your own actions
  if (userId === actorId) return;

  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      actor_id: actorId,
      type,
      post_id: postId ?? null,
      read: false,
    });
    if (error) console.error("Notification error:", error.message);
  } catch (err) {
    console.error("Notification failed:", err);
  }
}
