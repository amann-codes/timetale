"use server";

import prisma from "@/lib/db/prisma";
import { auth } from "../auth/auth";

export const patchFlair = async ({ id, name, description, color }: { id?: string; name: string; description: string; color: string }) => {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        
        if (!userId) {
            throw new Error("Authentication required to update a flair.");
        }

        const response = await prisma.flair.update({
            where: { id, userId },
            data: {
                name, description, color
            }
        })
        if (!response) {
            throw new Error(`Could not udpate flair: ${id}`)
        }
    } catch (e) {
        throw new Error(`Error occured while updating flair ${id}: ${e}`)
    }
}