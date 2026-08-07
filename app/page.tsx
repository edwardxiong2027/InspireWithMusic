import type { Metadata } from "next";
import { InspireSite } from "./site/InspireSite";

export const metadata: Metadata = {
  title: "Inspire With Music | Youth in Service",
  description:
    "Young musicians turning talent into meaningful service through performance, teaching, mentorship, and community outreach.",
};

export default function Home() {
  return <InspireSite />;
}
