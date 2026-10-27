import type { Metadata } from "next";
import { Theming } from "@/surfaces/theming";

export const metadata: Metadata = {
  title: "Theming – Skullet",
  description:
    "Colours, animation, corners and type for skullet's skeletons — try them on a real page.",
};

export default function Page() {
  return <Theming />;
}
