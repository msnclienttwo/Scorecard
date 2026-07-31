import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://scorebolt.app";

const STATIC_ROUTES = [
  "",
  "/dashboard",
  "/matches",
  "/matches/create",
  "/teams",
  "/players",
  "/tournaments",
  "/analytics",
  "/settings",
  "/profile",
  "/notifications",
];

const MATCH_IDS = ["1", "2", "3", "4", "5"];

const MATCH_ROUTES = [
  "",
  "/scorecard",
  "/ball-by-ball",
  "/commentary",
  "/statistics",
  "/score",
];

const LIVE_ROUTES = MATCH_IDS.map((id) => `/score/${id}`);

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "/dashboard" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  const matchEntries: MetadataRoute.Sitemap = MATCH_IDS.flatMap((id) =>
    MATCH_ROUTES.map((route) => ({
      url: `${BASE_URL}/matches/${id}${route}`,
      lastModified: new Date(),
      changeFrequency: "always" as const,
      priority: route === "/score" ? 0.9 : 0.7,
    }))
  );

  const liveEntries: MetadataRoute.Sitemap = LIVE_ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "always",
    priority: 0.95,
  }));

  return [...staticEntries, ...matchEntries, ...liveEntries];
}
