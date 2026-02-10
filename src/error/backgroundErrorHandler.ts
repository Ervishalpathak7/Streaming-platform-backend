import logger from "@/lib/winston.js";
import type { TRPCError } from "@trpc/server";

export const handleBackgroundError = (
  error: Error,
  type = "UNEXPECTED",
  context = "No Context Set",
) => {
  logger.error(`Error while ${type} : ${error.message} : ${context}`, {
    stack: error.stack,
  });
};

export const trpcErrorHandler = (err: TRPCError) => {
  logger.warn("TRPCError:", {
    code: err.code,
    message: err.message,
    stack: err.stack,
  });

  switch (err.code) {
    case "UNAUTHORIZED":
      return { status: 401, error: "Unauthorized" };
    case "FORBIDDEN":
      return { status: 403, error: "Forbidden" };
    case "NOT_FOUND":
      return { status: 404, error: "Not Found" };
    case "INTERNAL_SERVER_ERROR":
      return { status: 500, error: "Internal Server Error" };
    default:
      return { status: 500, error: "An unexpected error occurred" };
  }
};

export const openApiErrorHandler = (err: any) => {
  const errors = [] as any[];

  if (err.errors[0]?.path === "/body/email") {
    if (err.errors[0]?.errorCode === "pattern.openapi.validation")
      errors.push({ message: "Invalid email format", field: "email" });
    if (err.errors[0]?.errorCode === "required.openapi.validation")
      errors.push({ message: "Email is required", field: "email" });
  } else if (err.errors[0]?.path === "/body/password") {
    if (err.errors[0]?.errorCode === "pattern.openapi.validation")
      errors.push({
        message: "Password must be 8-20 characters long",
        field: "password",
      });
    if (err.errors[0]?.errorCode === "required.openapi.validation")
      errors.push({ message: "Password is required", field: "password" });
  } else if (err.errors[0]?.path === "/body/name") {
    if (err.errors[0]?.errorCode === "required.openapi.validation")
      errors.push({ message: "Name is required", field: "name" });
    if (err.errors[0]?.errorCode === "pattern.openapi.validation")
      errors.push({
        message: "Name must be at least 3 characters long",
        field: "name",
      });
  }
  return {
    status: err.status || 500,
    errors:
      errors.length > 0
        ? errors
        : [{ message: "An unexpected error occurred" }],
  };
};
