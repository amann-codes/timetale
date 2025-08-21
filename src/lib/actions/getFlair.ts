"use server";

import { Flair } from "@/lib/types";

export const getFlair = async (flairId: string): Promise<Flair> => {
  if (!flairId) {
    throw new Error("Flair ID is required");
  }
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/flairs?flairId=${flairId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch flair: ${res.status} ${res.statusText}`);
    }
    const flair: Flair = await res.json();
    return flair;
  } catch (e) {
    console.error(`Error fetching flair with id ${flairId}:`, e);
    throw new Error(`Unable to retrieve flair: ${e instanceof Error ? e.message : "Unknown error"}`);
  }
};