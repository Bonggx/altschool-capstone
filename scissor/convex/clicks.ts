import { v } from "convex/values";
import { query } from "./_generated/server";

// Returns all click events for a specific link
// Used by the analytics dashboard to build charts
export const getClicksByLink = query({
  args: { linkId: v.id("links") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clicks")
      .withIndex("by_link", (q) => q.eq("linkId", args.linkId))
      .order("desc")
      .collect();
  },
});
