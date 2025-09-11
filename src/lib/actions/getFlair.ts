"use server";

import prisma from "@/lib/db/prisma";

export const getFlair = async ({ flairId }: { flairId: string }) => {
  try {
    const flair = await prisma.flair.findUnique({
      where: { id: flairId },
      select: {
        id: true,
        name: true,
        description: true,
        color: true,
      }
    })
    if (!flair) {
      throw new Error(`Flair with Id: ${flairId} not found`)
    }
    return flair;
  } catch (e) {
    throw new Error(`Error fethcing flair: ${e}`)
  }
};