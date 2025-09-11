
"use server";
import { getFlair } from '@/lib/actions/getFlair';

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, GenerationConfig, SchemaType } from "@google/generative-ai";
import { Schedule } from '../types';


const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);

export type Flair = {
  id: string;
  name: string;
  description: string;
  color: string;
}

export type ScheduleError = {
  error: string;
};

async function getFlairByFlairIds(ids: string[]): Promise<Flair[]> {
  const flairPromises = ids.map(async (id) => await getFlair({ flairId: id }));
  const flairs = await Promise.all(flairPromises);
  return flairs.filter((flair): flair is Flair => flair !== undefined && flair !== null);
}

export default async function generateSchedule(
  description: string,
  flairIds?: string[],
  currentSchedule?: Schedule[]
): Promise<Schedule[] | ScheduleError> {
  try {
    if (!description && (!flairIds || flairIds.length === 0)) {
      return { error: "A description or at least one flair ID is required to generate a schedule." };
    }

    let descriptionPromptPart = "";
    let flairPromptPart = "";

    if (flairIds && flairIds.length > 0) {
      const flairDetails = await getFlairByFlairIds(flairIds);
      if (flairDetails && flairDetails.length > 0) {
        flairPromptPart = `
                **Source 1: Pre-defined Flair Tasks**
                Create tasks directly from the 'description' field of each flair object listed here. These are pre-defined tasks.
                - **Flair Details:**
                \`\`\`json
                ${JSON.stringify(flairDetails, null, 2)}
                \`\`\`
                - **Creation Rule:** For each flair, create a task. Every task created from a flair MUST include that flair's 'id' in the 'flairId' field of the final task object.
            `;
      } else if (!description) {
        return { error: "Could not find details for the provided flair IDs." };
      }
    }

    if (description) {
      descriptionPromptPart = `
            **Source 2: User's Custom Request**
            Create tasks based on the following natural language description.
            - **Description:** "${description}"
            - **Association Rule:** When creating these tasks, if flair details are available, you should associate each task with the most relevant flair ID. If no flair seems relevant, you can omit the flairId for that specific task.
        `;
    }

    const schedulingFocusPrompt = `
      **Your Goal:** You will create schedule items from the sources listed below. You must merge all generated tasks together and with the existing schedule without creating time conflicts.

      ${flairPromptPart}
      ${descriptionPromptPart}
    `;

    const hasExistingSchedule = currentSchedule && currentSchedule.length > 0;
    const existingScheduleContext = hasExistingSchedule
      ? `
        **Existing Schedule Context:**
        The user already has tasks scheduled. You MUST add new tasks to this schedule without creating time conflicts.
        The existing schedule is:
        \`\`\`json
        ${JSON.stringify(currentSchedule, null, 2)}
        \`\`\`
        Your final output must be a single JSON array containing ALL tasks (both existing and new), sorted chronologically.
        `
      : `
        **Goal:**
        Create a new schedule based on the user's request.
        Your final output must be a JSON array of the new tasks, sorted chronologically.
        `;

    const currentDateForAI = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const fullPrompt = `
      You are an intelligent task scheduler. Your primary goal is to convert a user's request into a structured schedule.

      ${existingScheduleContext}

      ${schedulingFocusPrompt}

      **Current Date Context:** For reference, the user is making this request on **${currentDateForAI}**. Use this as an anchor for relative terms like "today" or "tomorrow."

      **Required Task Structure:**
      Each task in the generated schedule MUST be an object with these properties:
      - \`title\`: A concise title for the task (e.g., "Prepare Project Presentation").
      - \`dateTime\`: The precise start time in ISO 8601 format ('YYYY-MM-DDTHH:MM:SSZ').
      - \`duration\`: The task's duration (e.g., "1 hour", "30 minutes").
      - \`flairId\`: The string ID of the flair this task is associated with.

      **Crucial Scheduling Rules:**
      1.  **Strict Non-Overlap**: No two tasks should have overlapping times. Adjust new tasks to the earliest available slot if a conflict arises.
      2.  **Date Priority**: Prioritize specific dates ("July 25th") or relative dates ("next Monday") mentioned by the user. Default to the "Current Date Context" only if no date is specified.
      3.  **Time Interpretation**: "morning" is 09:00-12:00, "afternoon" is 13:00-17:00, "evening" is 18:00-21:00.

      **IMPORTANT: Your response MUST be ONLY the JSON array. DO NOT include any markdown formatting (like \`\`\`json) or conversational text.**
    `;

    const model = genAI.getGenerativeModel({
      model: String(process.env.GEMINI_MODEL),
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const generationConfig: GenerationConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            dateTime: { type: SchemaType.STRING, format: "date-time" },
            duration: { type: SchemaType.STRING },
            flairId: { type: SchemaType.STRING }
          },
          required: ["title", "dateTime", "duration"],
        },
      },
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
      generationConfig,
    });


    const responseText = result.response.text();
    if (responseText) {
      try {
        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse JSON from AI response:", responseText, parseError);
        return { error: "Failed to parse schedule from AI. The response was not valid JSON." };
      }
    } else {
      console.error("API response text was empty:", result.response);
      return { error: "Failed to generate schedule: The AI returned an empty response." };
    }
  } catch (error) {
    console.error("Error generating schedule with Gemini:", error);
    return { error: `Failed to generate schedule due to an internal server error: ${error}` };
  }
}
