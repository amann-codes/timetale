"use server";

import prisma from "@/lib/db/prisma"; 
import { Schedule } from "@/lib/types"; 
import { auth } from "@/lib/auth/auth";
import generateSchedule from "../gemini/generateSchedule";


interface CreateOrUpdateScheduleParams {
    description: string;
    flairIds?: string[];
}

export const createTask = async ({ description, flairIds }: CreateOrUpdateScheduleParams) => {
    
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        throw new Error("Authentication required. Please sign in.");
    }

    try {
        
        const existingSchedule = await prisma.schedule.findFirst({
            where: { userId },
        });

        if (existingSchedule) {
            
            const updatedSchedule = await generateSchedule(
                description,
                flairIds,
                existingSchedule.schedule as unknown as Schedule[] 
            );

            
            if (!updatedSchedule || 'error' in updatedSchedule) {
                console.error("Failed to generate updated schedule:", updatedSchedule);
                throw new Error("The AI failed to generate an updated schedule.");
            }

            const updateResult = await prisma.schedule.update({
                where: { id: existingSchedule.id },
                data: { schedule: updatedSchedule },
            });

            
            return updateResult;

        } else {
            
            const newSchedule = await generateSchedule(description, flairIds);

            if (!newSchedule || 'error' in newSchedule) {
                console.error("Failed to generate new schedule:", newSchedule);
                throw new Error("The AI failed to generate a new schedule.");
            }

            const createResult = await prisma.schedule.create({
                data: {
                    userId,
                    schedule: newSchedule,
                },
            });

            return createResult;
        }
    } catch (e) {
        console.error("Error during schedule processing:", e);
        throw new Error("An unexpected error occurred while processing your schedule.");
    }
};