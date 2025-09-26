import SchedulePage from "@/components/pages/schedule/SchdulePage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TimeTail",
  description: "Create yout timeline with description"
}

export default function Page() {
  return <SchedulePage />
}