import { TRPCError } from "@trpc/server";
import { middleware } from "@/trpc/trpc.js";

export const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Expired or invalid token",
    });
  }
  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});
