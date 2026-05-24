import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// defineSchema tells Convex the exact shape of every table in the database
// Convex enforces these types at runtime — no invalid data can get in
export default defineSchema({

  // The links table stores every shortened URL
  links: defineTable({
    userId: v.string(),       // Clerk user ID — "guest" for anonymous users
    originalUrl: v.string(),  // The full long URL the user submitted
    slug: v.string(),         // The short identifier e.g. "aBc123"
    customSlug: v.boolean(),  // Whether the slug was chosen by the user or auto-generated
    clicks: v.number(),       // Running total of how many times this link was visited
    isActive: v.boolean(),    // Owners can deactivate links without deleting them
    expiresAt: v.optional(v.number()), // Unix timestamp — null means the link never expires
    createdAt: v.number(),    // Unix timestamp of when the link was created
  })
    // Index by slug so we can look up a link in O(1) time during redirects
    .index("by_slug", ["slug"])
    // Index by user so we can fetch all links for a dashboard in O(1) time
    .index("by_user", ["userId"]),

  // The clicks table stores every individual click event for analytics
  clicks: defineTable({
    linkId: v.id("links"),  // Reference to the link that was clicked
    timestamp: v.number(),  // Exact time of the click as a Unix timestamp
    referrer: v.string(),   // Where the visitor came from e.g. "twitter.com" or "Direct"
    device: v.string(),     // "mobile", "tablet", or "desktop"
    country: v.string(),    // Two-letter country code from Cloudflare/Vercel headers
  })
    // Index by linkId so we can fetch all clicks for one link efficiently
    .index("by_link", ["linkId"]),
});