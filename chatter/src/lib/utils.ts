import { format, formatDistanceToNow } from "date-fns";

// Formats a date string into a readable format like "May 23, 2026"
export function formatDate(date: string | Date) {
  return format(new Date(date), "MMM d, yyyy");
}

// Returns a relative time string like "2 hours ago" or "3 days ago"
export function timeAgo(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// Calculates estimated reading time from word count
// Average reading speed is around 200 words per minute
export function calculateReadingTime(content: string) {
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes;
}

// Converts a post title into a URL-friendly slug
// "Hello World!" becomes "hello-world"
export function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Strips HTML tags from a string — used to generate plain text excerpts
export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "");
}

// Generates a short excerpt from post content
export function generateExcerpt(content: string, maxLength = 160) {
  const plain = stripHtml(content);
  if (plain.length <= maxLength) return plain;
  return plain.substring(0, maxLength).trim() + "...";
}

// Copies text to the clipboard
export function copyToClipboard(text: string) {
  return navigator.clipboard.writeText(text);
}

// Formats large numbers — 1500 becomes "1.5K"
export function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// Inserts a notification into the notifications table
// Called whenever a user likes a post, comments, or follows someone
export async function createNotification(
  supabase: any,
  userId: string,
  actorId: string,
  type: "like" | "comment" | "follow",
  postId?: string
) {
  // Don't notify users about their own actions
  if (userId === actorId) return;

  await supabase.from("notifications").insert({
    user_id: userId,
    actor_id: actorId,
    type,
    post_id: postId ?? null,
    read: false,
  });
}
