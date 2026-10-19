import type { Metadata, Viewport } from "next";
import "@/styles/globals.scss";
import { Analytics } from "@vercel/analytics/next";
import { SkeleProvider } from "skele/react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Skele – Dependency-Free Skeleton Loading",
  description: "Dependency-free skeleton loading component.",
  openGraph: {
    type: "website",
    url: "https://skele.lochie.me",
    siteName: "Skele",
    title: "Skele – Dependency-Free Skeleton Loading",
    description: "Dependency-free skeleton loading component.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@lochieaxon",
    creator: "@lochieaxon",
    title: "Skele",
    description: "Dependency-free skeleton loading component.",
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
        <SkeleProvider mode="dark">
          {children}
        </SkeleProvider>
        <Analytics />
      </body>
    </html>
  );
}
