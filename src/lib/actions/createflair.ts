"use server";

export const createFlair = async ({ userId, name, description, color }: { userId?: string; name: String; description: string; color: string }) => {
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/api/flairs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, name, description, color }),
        });
        return response.json();
    } catch (e) {
        throw new Error(`Error while creating your schedule: ${e}`)
    }
}