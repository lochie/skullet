import type { Metadata } from "next";
import { Docs } from "@/surfaces/docs";

export const metadata: Metadata = {
  title: "Docs – Skele",
  description:
    "Skeletons measured from your content, for React, Vue, Svelte and vanilla JavaScript.",
};

export default function Page() {
  return <Docs />;
}
