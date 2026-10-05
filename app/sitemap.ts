import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://earn.blissbiovn.com";
  return ["", "/terms", "/privacy", "/faq", "/support"].map((path, index) => ({ url: `${baseUrl}${path}`, lastModified: new Date(), changeFrequency: index ? "monthly" as const : "daily" as const, priority: index ? 0.4 : 1 }));
}
