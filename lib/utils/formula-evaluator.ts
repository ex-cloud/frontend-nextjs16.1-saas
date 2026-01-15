import { Task } from "@/types/project";

export function evaluateFormula(
  formula: string,
  task: Task
): number | string | null {
  if (!formula) return null;

  try {
    // 1. Replace variables {{field_name_or_id}} with actual values
    let evaluated = formula.replace(/\{\{(.*?)\}\}/g, (_, key) => {
      // Safely check for core fields on task or custom values
      const val =
        (task as unknown as Record<string, unknown>)[key] ??
        task.custom_values?.[key];

      // Return value as string, default to 0 for math operations
      return String(val ?? 0);
    });

    // 2. Sanitize: only allow numbers, math operators, and spaces
    // Remove everything except 0-9, ., +, -, *, /, (, ), and spaces
    evaluated = evaluated.replace(/[^0-9.\+\-\*\/\(\)\s]/g, "");

    // 3. Evaluate the expression
    // Using Function as a safer alternative to eval for simple math expressions
    // since we've already sanitized the input to only contain math tokens.
    const result = new Function(`return ${evaluated}`)();

    if (typeof result === "number" && !isNaN(result)) {
      return result;
    }

    return String(result);
  } catch (error) {
    console.error("Formula evaluation error:", error);
    return "Error";
  }
}
