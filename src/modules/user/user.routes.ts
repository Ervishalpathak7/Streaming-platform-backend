import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { getUserProfileHandler } from "./user.controller";
import { authenticate } from "../../common/middleware/auth.middleware";
import { z } from "zod";

const userProfileResponseSchema = z.object({
  status: z.literal("success"),
  message: z.string(),
  data: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
});

export async function userRoutes(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/profile",
    {
      preHandler: [authenticate],
      schema: {
        response: {
          200: userProfileResponseSchema,
        },
        tags: ["User"],
        security: [{ bearerAuth: [] }],
      },
    },
    getUserProfileHandler,
  );
}
