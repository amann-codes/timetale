"use server";

import { auth } from "../auth/auth";
import { Schedule } from "../types";

import prisma from "@/lib/db/prisma"

export const getSchedule = async (): Promise<Schedule[]> => {
    try {
        const session = await auth();
        const userId = session?.user?.id;
        if (!userId) {
            throw new Error("User must sign-in to get their flair.");
        }
        const response = await prisma.schedule.findUnique({
            where: {
                userId
            },
            select: {
                schedule: true
            }
        });
        if (response?.schedule == null) {
            return []
        }
        return response.schedule as Schedule[];
    } catch (e) {
        throw new Error(`Error occured while getting schedule: ${e}`)
    }
};