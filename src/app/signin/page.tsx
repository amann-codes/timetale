import SignIn from "@/components/pages/auth/Signin";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signin | Timetail",
  description: "Signin to create your schedules"
}

export default function page() {
  return <SignIn />;
}