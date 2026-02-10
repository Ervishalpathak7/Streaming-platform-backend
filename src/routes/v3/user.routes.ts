import { meResSchema } from "@/Schemas/user.schmea.js";
import { findUserById } from "@/services/user.services.js";
import { mapToTRPCError } from "@/trpc/mapError.js";
import { protectedProcedure, router } from "@/trpc/trpc.js";
import z from "zod";

export const trpcUserRouter = router({
  me: protectedProcedure
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
