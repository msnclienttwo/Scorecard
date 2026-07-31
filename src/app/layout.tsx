import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://scorebolt.app"),
  title: {
    default: "ScoreBolt - Live Cricket Scoring, Reimagined",
    template: "%s | ScoreBolt",
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
  authors: [{ name: "ScoreBolt" }],
  creator: "ScoreBolt",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://scorebolt.app",
    siteName: "ScoreBolt",
    title: "ScoreBolt - Live Cricket Scoring, Reimagined",
    description:
      "Create matches, score live, and share with the world. The most beautiful cricket scoring platform ever built.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ScoreBolt - Live Cricket Scoring",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ScoreBolt - Live Cricket Scoring, Reimagined",
    description:
      "Create matches, score live, and share with the world. The most beautiful cricket scoring platform ever built.",
    images: ["/og-image.png"],
    creator: "@scorebolt",
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
