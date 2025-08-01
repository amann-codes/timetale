"use server";

import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({});

export type ScheduleItem = {
  // The 'id' property is not part of the AI's output, so we can omit it from the core type used here.
  // It's likely added later when saving to a database.
  title: string;
  dateTime: string;
  duration: string;
};

export default async function generateSchedule(
  description: string,
  currentSchedule?: ScheduleItem[]
) {
  try {
    const hasExistingSchedule = currentSchedule && currentSchedule.length > 0;

    const promptContext = hasExistingSchedule
      ? `
        **Existing Schedule Context:**
        The user already has the following tasks scheduled. You MUST add the new tasks from the description to this schedule without creating any time conflicts. The existing schedule is:
        \`\`\`json
        ${JSON.stringify(currentSchedule, null, 2)}
        \`\`\`
        Your final output must be a single JSON array containing ALL tasks (both existing and new), sorted chronologically.
        `
      : `
        **Goal:**
        Your goal is to create a new schedule based on the user's description.
        Your final output must be a JSON array containing the new tasks, sorted chronologically.
        `;

    // --- FIX: Provide a clearer, more human-readable date context ---
    const currentDateForAI = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const payload = {
      contents: [
        {
          parts: [
            {
              text: `
                You are an intelligent task scheduler. Your primary goal is to take a user's natural language description and convert it into a structured schedule.

                ${promptContext}

                **Current Date Context:** For reference, the user is making this request on **${currentDateForAI}**. Use this date as the anchor for relative terms like "today," "tomorrow," or "next week."

                **Required Task Structure:**
                Each task in the generated schedule MUST be an object with the following properties:
                - \`title\`: A concise and specific title for the task (e.g., "Prepare Project Presentation").
                - \`dateTime\`: The precise start time in ISO 8601 format ('YYYY-MM-DDTHH:MM:SSZ').
                - \`duration\`: The duration of the task (e.g., "1 hour", "30 minutes"). Assume a reasonable default if not specified.

                **Crucial Scheduling Rules:**
                1.  **Date Priority**: This is the most important rule. You **MUST** prioritize any specific date (e.g., "on July 25th", "August 1st") or relative date (e.g., "tomorrow", "next Monday") mentioned by the user for a task. Only if a task has **no date information at all** should you default to the "Current Date Context".
                2.  **Strict Non-Overlap**: Ensure that no two tasks in the final schedule have overlapping time slots. If a new task conflicts with an existing one, adjust its start time to the earliest available slot *after* the conflicting task.
                3.  **Time Interpretation**:
                    * "in the morning": 09:00 AM to 12:00 PM.
                    * "before evening": Before 17:00 (5:00 PM).
                    * "at 6 pm": Precisely 18:00.
                4.  **Default Start Time**: If a task has no specific time, default its start to 09:00 AM or the next available slot.

                **IMPORTANT: Your response MUST be ONLY the JSON array. DO NOT include any markdown formatting (like \`\`\`json) or conversational text.**

                User's New Task Description: "${description}"
              `,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              dateTime: { type: Type.STRING, format: "date-time" },
              duration: { type: Type.STRING },
            },
            required: ["title", "dateTime", "duration"],
          },
        },
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      ...payload,
    });

    if (typeof response.text === "string") {
      let cleanedResponseText = response.text.trim();
      if (
        cleanedResponseText.startsWith("```json") &&
        cleanedResponseText.endsWith("```")
      ) {
        cleanedResponseText = cleanedResponseText
          .substring(7, cleanedResponseText.length - 3)
          .trim();
      }

      const jsonResponse = JSON.parse(cleanedResponseText);

      return jsonResponse;
    } else {
      console.error("API response text was not a string:", response.text);
      return {
        error: "Failed to generate schedule: Unexpected API response format.",
      };
    }
  } catch (error) {
    console.error("Error generating schedule:", error);
    return {
      error: "Failed to generate schedule due to an internal server error.",
    };
  }
}