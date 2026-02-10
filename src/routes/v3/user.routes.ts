import { meResSchema } from "@/Schemas/user.schmea.js";
import { findUserById } from "@/services/user.services.js";
import { mapToTRPCError } from "@/trpc/mapError.js";
import { protectedProcedure, router } from "@/trpc/trpc.js";
import z from "zod";

export const trpcUserRouter = router({
  me: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/me",
        tags: ["User"],
        description: "Fetches the details of the currently authenticated user.",
        protect: true,
        contentTypes: ["application/json"],
        successDescription: "User fetched successfully",
        errorResponses: [
          400, // Bad Request (validation errors)
          500, // Internal Server Error
          429, // Too Many Requests (rate limiting)
        ],
      },
    })
    .input(z.undefined())
    .output(meResSchema)
    .query(async ({ ctx }) => {
      try {
        const user = await findUserById(ctx.userId as string);
        return {
          message: "User fetched successfully",
          status: "success",
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          },
        };
      } catch (error) {
        mapToTRPCError(error);
      }
    }),
});
