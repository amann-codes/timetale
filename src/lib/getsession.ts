"use server";

import { getSession } from "next-auth/react";

export async function getUserId() {
  const session = await getSession();
  return session;
}
