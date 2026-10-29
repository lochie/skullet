import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false },
};

export default function LabLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
