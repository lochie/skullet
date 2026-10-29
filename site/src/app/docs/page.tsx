import type { Metadata } from "next";
import { getDownloads } from "@/components/docs-layout/downloads";
import { Docs } from "@/surfaces/docs";

export const metadata: Metadata = {
  title: "Docs 🦴 Skullet",
  description:
    "Skeletons measured from your content, for React, Vue, Svelte and vanilla JavaScript.",
};

export default async function Page() {
  return <Docs downloads={await getDownloads()} />;
}
