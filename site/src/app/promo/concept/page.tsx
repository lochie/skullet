import type { Metadata } from "next";
import { Concept } from "@/surfaces/promo-concept";

export const metadata: Metadata = {
  title: "Skullet concept",
  robots: { index: false },
};

export default function Page() {
  return <Concept />;
}
