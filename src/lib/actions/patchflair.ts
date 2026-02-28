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
        if (!id) {
            throw new Error("Flair id is required.");
        }

        const existing = await prisma.flair.findFirst({
            where: { id, userId },
        });
        if (!existing) {
            throw new Error(`Flair not found or access denied: ${id}`);
        }

        const response = await prisma.flair.update({
            where: { id },
            data: { name, description, color },
        });
        if (!response) {
            throw new Error(`Could not update flair: ${id}`);
        }
        return response;
    } catch (e) {
        throw new Error(`Error occurred while updating flair: ${e}`);
    }
}