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
  title: "Skullet – Dependency-Free Skeleton Loading",
  description: "Dependency-free skeleton loading component.",
  openGraph: {
    type: "website",
    url: "https://skullet.lochie.me",
    siteName: "Skullet",
    title: "Skullet – Dependency-Free Skeleton Loading",
    description: "Dependency-free skeleton loading component.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@lochieaxon",
    creator: "@lochieaxon",
    title: "Skullet",
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
        <SkulletProvider mode="dark">
          {children}
        </SkulletProvider>
        <Analytics />
      </body>
    </html>
  );
}
