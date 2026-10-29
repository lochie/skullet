import type { Metadata, Viewport } from "next";
import "@/styles/globals.scss";
import { Analytics } from "@vercel/analytics/next";
import { Courier_Prime } from "next/font/google";
import localFont from "next/font/local";
import { SkulletProvider } from "skullet/react";

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

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier-prime",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

const SITE = "https://skullet.lochie.me";
// Next resolves image URLs against metadataBase, but leaves video URLs as written
const VIDEO = `${SITE}/opengraph-video.mp4`;

export const metadata: Metadata = {
  // Open Graph needs absolute URLs
  metadataBase: new URL(SITE),
  title: "Skullet 🦴 Smart skeleton states",
  description: "Smart skeleton states.",
  openGraph: {
    type: "website",
    url: SITE,
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
      className={`${openRunde.variable} ${courierPrime.variable}`}
    >
      <body>
        <SkulletProvider mode="dark">{children}</SkulletProvider>
        <Analytics />
      </body>
    </html>
  );
}
