import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ScoreCast - Live Cricket Scoring, Reimagined",
    template: "%s | ScoreCast",
  },
  description:
    "Create matches, score live, and share with the world. The most beautiful cricket scoring platform ever built.",
  keywords: [
    "cricket",
    "live scoring",
    "cricket scorecard",
    "cricket analytics",
    "tournament management",
    "cricket app",
  ],
  authors: [{ name: "ScoreCast" }],
  creator: "ScoreCast",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://scorecast.app",
    siteName: "ScoreCast",
    title: "ScoreCast - Live Cricket Scoring, Reimagined",
    description:
      "Create matches, score live, and share with the world. The most beautiful cricket scoring platform ever built.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ScoreCast - Live Cricket Scoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScoreCast - Live Cricket Scoring, Reimagined",
    description:
      "Create matches, score live, and share with the world. The most beautiful cricket scoring platform ever built.",
    images: ["/og-image.png"],
    creator: "@scorecast",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
