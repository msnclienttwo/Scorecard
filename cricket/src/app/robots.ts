import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://scorecast.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/dashboard",
          "/matches",
          "/matches/*",
          "/teams",
          "/players",
          "/tournaments",
          "/analytics",
        ],
        disallow: [
          "/api",
          "/api/*",
          "/settings",
          "/profile",
          "/notifications",
          "/search",
          "/admin",
          "/admin/*",
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "ChatGPT-User",
        disallow: ["/"],
      },
      {
        userAgent: "CCBot",
        disallow: ["/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
