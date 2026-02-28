/**
 * Map server/raw errors to user-friendly messages. Never expose stack traces or internal details.
 */
export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message || "";
    // Auth
    if (msg.includes("Authentication") || msg.includes("Unauthorized") || msg.includes("sign in"))
      return "Please sign in to continue.";
    if (msg.includes("Task not found") || msg.includes("access denied"))
      return "This task could not be found or you don't have permission to change it.";
    // Tasks
    if (msg.includes("Title is required") || msg.includes("title"))
      return "Please enter a task title.";
    if (msg.includes("Duration") || msg.includes("duration"))
      return "Please enter a valid duration (at least 1 minute).";
    if (msg.includes("Invalid start time") || msg.includes("start"))
      return "Please choose a valid date and time.";
    if (msg.includes("AI failed") || msg.includes("generate"))
      return "We couldn't create tasks from that description. Try rephrasing or adding a task manually.";
    if (msg.includes("schedule") || msg.includes("task"))
      return "Something went wrong with your schedule. Please try again.";
    // Flairs
    if (msg.includes("flair") || msg.includes("Flair"))
      return "Something went wrong saving that. Please try again.";
    // Generic fallback: don't show raw message
    return "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}
