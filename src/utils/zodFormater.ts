import type { ZodFormattedError } from "zod";

export function formatZodErrors(
  formatted: ZodFormattedError<any>
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  for (const key in formatted) {
    if (key === "_errors") continue;

    const entry = formatted[key];
    if (!entry || typeof entry !== "object") continue;

    const errors = entry._errors;
    if (Array.isArray(errors) && errors.length > 0) {
      fieldErrors[key] = errors;
    }
  }

  return fieldErrors;
}
