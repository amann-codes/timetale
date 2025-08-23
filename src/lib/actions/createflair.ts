"use server";

import prisma from "@/lib/db/prisma";
import { auth } from "../auth/auth";

export const createFlair = async ({ name, description, color }: { name: string; description: string; color: string }) => {

    try {
        const session = await auth();
        const userId = session?.user?.id;

        if (!userId) {
            throw new Error("Authentication required to create a flair.");
        }

        const response = await prisma.flair.create({
            data: {
                userId, name, description, color
            }
        })

        if (!response) {
            console.error("Error creating flair", response)
            throw new Error("Failed to create flair");
        }

        return response;

    } catch (e) {
        console.error("Error creating flair", e)
        throw new Error("Failed to create flair");
    }
}