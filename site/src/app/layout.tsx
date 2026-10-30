import type { Metadata, Viewport } from "next";
import "@/styles/globals.scss";
import { Analytics } from "@vercel/analytics/next";
import localFont from "next/font/local";
import { SkulletProvider } from "skullet/react";
import { SITE_URL } from "@/utils/consts";

const openRunde = localFont({
  src: [
    { path: "../fonts/OpenRunde-Regular.woff2", weight: "400" },
    { path: "../fonts/OpenRunde-Medium.woff2", weight: "500" },
    { path: "../fonts/OpenRunde-Semibold.woff2", weight: "600" },
    { path: "../fonts/OpenRunde-Bold.woff2", weight: "700" },
  ],
  variable: "--font-open-runde",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

// Next resolves image URLs against metadataBase, but leaves video URLs as written
const VIDEO = `${SITE_URL}/opengraph-video.mp4`;

export const metadata: Metadata = {
  // Open Graph needs absolute URLs
  metadataBase: new URL(SITE_URL),
  title: "Skullet 🦴 Smart skeleton states",
  description: "Smart skeleton states.",
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Skullet",
    title: "Skullet 🦴 Smart skeleton states",
    description: "Smart skeleton states.",
    videos: [
      {
        url: VIDEO,
        secureUrl: VIDEO,
        type: "video/mp4",
        width: 1440,
        height: 760,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@lochieaxon",
    creator: "@lochieaxon",
    title: "Skullet",
    description: "Smart skeleton states.",
  },
  other: {
    "msapplication-navbutton-color": "#000000",
    "apple-mobile-web-app-status-bar-style": "#000000",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openRunde.variable}`}
      // Next turns smooth scrolling off for route changes, so a new page opens at its top at once
      data-scroll-behavior="smooth"
    >
      <body>
        <SkulletProvider mode="dark">{children}</SkulletProvider>
        <Analytics />
      </body>
    </html>
  );
}
