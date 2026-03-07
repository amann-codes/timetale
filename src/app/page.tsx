import SchedulePage from "@/components/pages/schedule/SchdulePage";
import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TimeTail",
  description: "Create yout timeline with description"
}

export default async function Page() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth");
  }
  return <SchedulePage />;
}