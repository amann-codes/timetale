"use server";

export const patchFlair = async ({ id, name, description, color }: { id?: string; name: string; description: string; color: string }) => {
    try {
        const response = await fetch(`${process.env.BACKEND_URL}/api/flairs`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, name, description, color }),
        });
        const flair = await response.json();
        return flair;
    } catch (e) {
        throw new Error(`Error occured while getting schedule: ${e}`)
    }
}