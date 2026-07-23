export const siteConfig = {
  name: "ScoreCast",
  description:
    "Live cricket scoring platform with real-time updates, detailed scorecards, and match analytics.",
  url: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  ogImage: "/og.png",
  links: {
    twitter: "https://twitter.com/scorecast",
    github: "https://github.com/scorecast",
  },
  navItems: [
    { label: "Home", href: "/" },
    { label: "Live Matches", href: "/matches/live" },
    { label: "Tournaments", href: "/tournaments" },
    { label: "Teams", href: "/teams" },
  ],
  navDashboardItems: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Matches", href: "/dashboard/matches" },
    { label: "Tournaments", href: "/dashboard/tournaments" },
    { label: "Teams", href: "/dashboard/teams" },
    { label: "Players", href: "/dashboard/players" },
  ],
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    uploadPreset: "scorecast_uploads",
  },
} as const;

export type SiteConfig = typeof siteConfig;
