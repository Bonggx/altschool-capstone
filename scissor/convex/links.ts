import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { customAlphabet } from "nanoid";

// Generates a random 6-character slug using only URL-safe characters
const generateSlug = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  6
);

// Slugs that would conflict with actual app routes — blocked server-side
const RESERVED_SLUGS = [
  "api", "dashboard", "admin", "login", "signup",
  "logout", "register", "home", "about", "contact",
  "pricing", "help", "support", "terms", "privacy",
];

// Known malicious domains — any URL from these is rejected immediately
const BLOCKED_DOMAINS = [
  "malware.com", "phishing.com", "spam.com",
];

function isDomainBlocked(url: string) {
  try {
    const { hostname } = new URL(url);
    return BLOCKED_DOMAINS.some((d) => hostname.includes(d));
  } catch {
    return true;
  }
}

// Creates a new shortened link and stores it in the database
export const createLink = mutation({
  args: {
    originalUrl: v.string(),
    customSlug: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    if (isDomainBlocked(args.originalUrl)) {
      throw new Error("This URL has been blocked for security reasons.");
    }

    let slug = args.customSlug?.trim();

    if (slug) {
      if (RESERVED_SLUGS.includes(slug.toLowerCase())) {
        throw new Error("This slug is reserved.");
      }
      const existing = await ctx.db
        .query("links")
        .withIndex("by_slug", (q) => q.eq("slug", slug!))
        .first();
      if (existing) {
        throw new Error("This slug is already taken.");
      }
    } else {
      let attempts = 0;
      do {
        slug = generateSlug();
        const existing = await ctx.db
          .query("links")
          .withIndex("by_slug", (q) => q.eq("slug", slug!))
          .first();
        if (!existing) break;
        attempts++;
      } while (attempts < 5);
    }

    const linkId = await ctx.db.insert("links", {
      userId: args.userId,
      originalUrl: args.originalUrl,
      slug: slug!,
      customSlug: !!args.customSlug,
      clicks: 0,
      isActive: true,
      expiresAt: args.expiresAt,
      createdAt: Date.now(),
    });

    return { linkId, slug };
  },
});

// Returns all links belonging to a specific user
export const getUserLinks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Looks up a single link by its slug — used by the redirect page
export const getLinkBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// Deletes a link — only the owner can delete their own links
export const deleteLink = mutation({
  args: { linkId: v.id("links"), userId: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link || link.userId !== args.userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.linkId);
  },
});

// Records a click event and increments the link's click counter
export const incrementClicks = mutation({
  args: {
    linkId: v.id("links"),
    referrer: v.string(),
    device: v.string(),
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link) throw new Error("Link not found");
    await ctx.db.patch(args.linkId, {
      clicks: link.clicks + 1,
    });
    await ctx.db.insert("clicks", {
      linkId: args.linkId,
      timestamp: Date.now(),
      referrer: args.referrer || "Direct",
      device: args.device,
      country: args.country || "Unknown",
    });
  },
});

// Checks if a slug is available before the user submits the form
export const checkSlugAvailability = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    if (!args.slug) return { available: false };
    const existing = await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    return { available: !existing };
  },
});

// Returns aggregated analytics for a single link
export const getLinkStats = query({
  args: { linkId: v.id("links"), userId: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.linkId);
    if (!link || link.userId !== args.userId) return null;

    const clicks = await ctx.db
      .query("clicks")
      .withIndex("by_link", (q) => q.eq("linkId", args.linkId))
      .collect();

    const deviceBreakdown = clicks.reduce((acc, click) => {
      acc[click.device] = (acc[click.device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const referrerBreakdown = clicks.reduce((acc, click) => {
      acc[click.referrer] = (acc[click.referrer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const clicksOverTime = clicks
      .filter((c) => c.timestamp >= sevenDaysAgo)
      .reduce((acc, click) => {
        const date = new Date(click.timestamp).toISOString().split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return { link, deviceBreakdown, referrerBreakdown, clicksOverTime };
  },
});
