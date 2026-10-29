import type { Metadata } from "next";
import { getDownloads } from "@/components/docs-layout/downloads";
import { Playground } from "@/surfaces/playground";

export const metadata: Metadata = {
  title: "Playground 🦴 Skullet",
  description:
    "Every skullet feature, live: reveals, images, Suspense and real data.",
};

export default async function Page() {
  return <Playground downloads={await getDownloads()} />;
}
