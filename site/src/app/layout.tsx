import type { Metadata, Viewport } from "next";
import "@/styles/globals.scss";
import { Analytics } from "@vercel/analytics/next";
import { SkulletProvider } from "skullet/react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  // Open Graph needs absolute URLs; this resolves the image and video paths
  metadataBase: new URL("https://skullet.lochie.me"),
  title: "Skullet – Smart Skeleton States",
  description: "Smart Skeleton States.",
  openGraph: {
    type: "website",
    url: "https://skullet.lochie.me",
    siteName: "Skullet",
    title: "Skullet – Smart Skeleton States",
    description: "Smart Skeleton States.",
    videos: [
      {
        url: "/opengraph-video.mp4",
        secureUrl: "/opengraph-video.mp4",
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
    description: "Smart Skeleton States.",
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
    <html lang="en">
      <body>
        <SkulletProvider mode="dark">{children}</SkulletProvider>
        <Analytics />
      </body>
    </html>
  );
}
