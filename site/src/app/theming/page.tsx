import type { Metadata } from "next";
import { Theming } from "@/surfaces/theming";

export const metadata: Metadata = {
  title: "Theming – Skele",
  description:
    "Colours, animation, corners and type for skele's skeletons — try them on a real page.",
};

export default function Page() {
  return <Theming />;
}
