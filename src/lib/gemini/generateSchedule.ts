"use server";

import { getFlair } from "@/lib/actions/getFlair";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerationConfig,
  SchemaType,
} from "@google/generative-ai";

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
};

export type ScheduleError = {
  error: string;
};

export type GeneratedTask = {
  title: string;
  dateTime: string;
  duration: number;
  flairId?: string;
};

async function getFlairByFlairIds(ids: string[]): Promise<Flair[]> {
  const flairPromises = ids.map(async (id) => await getFlair({ flairId: id }));
  const flairs = await Promise.all(flairPromises);
  return flairs.filter(
    (flair): flair is Flair => flair !== undefined && flair !== null
  );
}

/**
 * Time parsing engine. Returns only new tasks as JSON.
 * Server is responsible for merging and resolving conflicts. No scheduling policy in AI.
 */
export async function generateTasksFromPrompt(
  description: string,
  flairIds?: string[]
): Promise<GeneratedTask[] | ScheduleError> {
  try {
    if (!description && (!flairIds || flairIds.length === 0)) {
      return {
        error:
          "A description or at least one flair ID is required to generate a schedule.",
      };
    }

    let descriptionPromptPart = "";
    let flairPromptPart = "";

    if (flairIds && flairIds.length > 0) {
      const flairDetails = await getFlairByFlairIds(flairIds);
      if (flairDetails && flairDetails.length > 0) {
        flairPromptPart = `
**Pre-defined Flair Tasks**
Create tasks from the 'description' field of each flair. Include that flair's 'id' in 'flairId' for each task created from it.
\`\`\`json
${JSON.stringify(flairDetails, null, 2)}
\`\`\``;
      } else if (!description) {
        return { error: "Could not find details for the provided flair IDs." };
      }
    }

    if (description) {
      descriptionPromptPart = `
**User request**
Create tasks from: "${description}"
If flairs are available, set flairId to the most relevant flair's id when appropriate. Omit flairId if none fit.`;
    }

    const currentDateForAI = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const fullPrompt = `
You are a time parsing engine. Return ONLY a JSON array of task objects. No markdown, no explanation.

**Current date:** ${currentDateForAI}

${flairPromptPart}
${descriptionPromptPart}

**Output rules:**
- Each object: { "title": string, "dateTime": ISO 8601 string, "duration": number (minutes), "flairId": optional string }
- Use ISO 8601 for dateTime.
- If date not provided, assume today.
- If time not provided, assume next available hour.
- Do not merge with any existing data. Return only the new tasks you generate.
- duration must be an integer (minutes).
`;

    const model = genAI.getGenerativeModel({
      model: String(process.env.GEMINI_MODEL),
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
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
            duration: { type: SchemaType.NUMBER },
            flairId: { type: SchemaType.STRING },
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
        const parsed = JSON.parse(responseText) as GeneratedTask[];
        return parsed.map((t) => ({
          ...t,
          duration: Math.round(t.duration),
        }));
      } catch (parseError) {
        console.error(
          "Failed to parse JSON from AI response:",
          responseText,
          parseError
        );
        return {
          error:
            "Failed to parse schedule from AI. The response was not valid JSON.",
        };
      }
    } else {
      console.error("API response text was empty:", result.response);
      return {
        error:
          "Failed to generate schedule: The AI returned an empty response.",
      };
    }
  } catch (error) {
    console.error("Error generating schedule with Gemini:", error);
    return {
      error: `Failed to generate schedule due to an internal server error: ${error}`,
    };
  }
}
