"use server";

import { Flair } from "@/lib/types";

export async function getFlair(id: string): Promise<Flair> {
  if (!id) {
    throw new Error("Flair ID is required");
  }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/flairs/flair=${id}`);

    if (!res.ok) {
      throw new Error(`Failed to fetch flair: ${res.status} ${res.statusText}`);
    }

    const data: Flair = await res.json();
    return data;
  } catch (error) {
    console.error(`Error fetching flair with id ${id}:`, error);
    throw new Error("Unable to retrieve flair data");
  }
}