import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://earn.blissbiovn.com";
  return [{ url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 }, { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 }];
}
