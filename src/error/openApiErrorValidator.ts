export function isOpenApiValidatorError(err: unknown): err is {
  status: number;
  message: string;
  errors: { path?: string; message: string }[];
} {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    "errors" in err &&
    Array.isArray((err as any).errors)
  );
}
