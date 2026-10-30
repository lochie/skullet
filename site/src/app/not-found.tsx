import type { Metadata } from "next";
import { NotFound } from "@/surfaces/not-found";

export const metadata: Metadata = {
  title: "Not found 🦴 Skullet",
};

export default function Page() {
  return <NotFound />;
}
