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
  title: "Skullet – Smart Skeleton States",
  description: "Smart Skeleton States.",
  openGraph: {
    type: "website",
    url: "https://skullet.lochie.me",
    siteName: "Skullet",
    title: "Skullet – Smart Skeleton States",
    description: "Smart Skeleton States.",
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
