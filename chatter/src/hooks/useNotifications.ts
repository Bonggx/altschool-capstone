import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

// Returns live unread counts for the notification bell and message envelope
export function useNotifications() {
  const { user } = useAuth();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadNotifications(0);
      setUnreadMessages(0);
      return;
    }

    // Fetch immediately on mount
    fetchCounts();

    // Poll every 10 seconds for new activity
    const interval = setInterval(fetchCounts, 10000);

    // Also subscribe to realtime changes on notifications table
    const notifSubscription = supabase
      .channel("notifications-changes")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchCounts();
      })
      .subscribe();

    // Subscribe to realtime changes on messages table
    const msgSubscription = supabase
      .channel("messages-changes")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `receiver_id=eq.${user.id}`,
      }, () => {
        fetchCounts();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(notifSubscription);
      supabase.removeChannel(msgSubscription);
    };
  }, [user]);

  async function fetchCounts() {
    if (!user) return;

    const [notifRes, msgRes] = await Promise.all([
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("read", false),
    ]);

    setUnreadNotifications(notifRes.count ?? 0);
    setUnreadMessages(msgRes.count ?? 0);
  }

  return { unreadNotifications, unreadMessages };
}
