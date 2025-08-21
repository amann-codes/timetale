"use server";

export const createTask = async ({ userId, description, flairIds }: { userId?: string; description: string, flairIds?: string[] }) => {
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/api/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, description, flairIds }),
        });
        const task = await response.json();
        return task;
    } catch (e) {
        throw new Error(`Error occured while getting schedule: ${e}`)

    }
}