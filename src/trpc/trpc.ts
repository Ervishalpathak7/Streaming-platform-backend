import { initTRPC } from "@trpc/server";
import type { Context } from "./context.js";
import { ZodError } from "zod";
import { formatZodErrors } from "@/utils/zodFormater.js";
import type { OpenApiMeta } from "trpc-to-openapi";

const trpc = initTRPC.context<Context>().meta<OpenApiMeta>().create({
  errorFormatter({ shape, error }) {
    const isZodError = error.cause instanceof ZodError;

    return {
      ...shape,
      message: isZodError
        ? (Object.values(formatZodErrors(error.cause.format()))[0]?.[0] ??
          "Invalid request payload")
        : error.message,
      data: {
        ...shape.data,
        validationErrors: isZodError
          ? formatZodErrors(error.cause.format())
          : null,
        isDomainError: error.code !== "INTERNAL_SERVER_ERROR",
      },
    };
  },
});

export const router = trpc.router;
export const middleware = trpc.middleware;
export const publicProcedure = trpc.procedure;
export const protectedProcedure = trpc.procedure;
