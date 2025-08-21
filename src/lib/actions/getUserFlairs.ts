"use server";

import { Flair } from "../types";

export const getUserFlairs = async (userId?: string): Promise<Flair[]> => {
    if (!userId) {
        throw new Error("User ID is required");
    }
    try {
        const res = await fetch(`${process.env.BACKEND_URL}/api/flairs?userId=${userId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            cache: "no-store",
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch flairs: ${res.status} ${res.statusText}`);
        }
        const flairs: Flair[] = await res.json();
        return flairs;
    } catch (e) {
        console.error(`Error fetching flairs for user ${userId}:`, e);
        throw new Error(`Unable to retrieve flairs: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
};