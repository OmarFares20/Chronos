import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL || "https://chronos.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE_URL,              lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE_URL}/providers`, lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE_URL}/match`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/security`,  lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    // Service category pages
    ...["photography","catering","decor","music","planning","venue","transport","videography","florist","makeup","entertainment","security"].map((cat) => ({
      url:              `${BASE_URL}/services/${cat}`,
      lastModified:     new Date(),
      changeFrequency:  "weekly" as const,
      priority:         0.8,
    })),
    { url: `${BASE_URL}/login`,    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE_URL}/register`, lastModified: new Date(), changeFrequency: "yearly",  priority: 0.5 },
    { url: `${BASE_URL}/terms`,    lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE_URL}/privacy`,  lastModified: new Date(), changeFrequency: "yearly",  priority: 0.3 },
  ];
}
