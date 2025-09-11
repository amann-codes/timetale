"use server";

import { auth } from "../auth/auth";
import { Flair } from "../types";
import prisma from "@/lib/db/prisma";

export const getUserFlairs = async (): Promise<Flair[]> => {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) {
            throw new Error("Authentication required to get flairs.");
        }
        const flairs = await prisma.flair.findMany({
            where: { userId }
        })
        if (!flairs) {
            return [];
        }
        return flairs;
    } catch (e) {
        throw new Error(`Unable to retrieve flairs: ${e instanceof Error ? e.message : "Unknown error"}`);
    }
};