"use server";

import { ScheduleDOC } from "../types";

export const getSchedule = async (userId?: string): Promise<ScheduleDOC> => {
    try {
        const res = await fetch(
            `${process.env.BACKEND_URL}/api/schedule?userId=${userId}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
        const schedule = await res.json();
        return schedule;
    } catch (e) {
        throw new Error(`Error occured while getting schedule: ${e}`)
    }
};