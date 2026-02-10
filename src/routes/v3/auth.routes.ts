import { createUser, findUserByEmail } from "@/services/user.services.js";
import { router, publicProcedure } from "@/trpc/trpc.js";
import { UnauthorizedError } from "@/error/index.js";
import { z } from "zod";
import { comparePassword } from "@/lib/bcrypt.js";
import { generateAccessToken } from "@/lib/jwt.js";
import { mapToTRPCError } from "@/trpc/mapError.js";
import {
  loginReqSchema,
  loginResSchema,
  registerReqSchema,
  registerResSchema,
} from "@/Schemas/auth.schema.js";

export const trpcAuthRouter = router({
  register: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/register",
        description: "Register a new user",
        protect: false,
        contentTypes: ["application/json"],
        successDescription: "User created successfully",
        errorResponses: [
          400, // Bad Request (validation errors)
          500, // Internal Server Error
          429, // Too Many Requests (rate limiting)
        ],
      },
    })
    .input(registerReqSchema)
    .output(registerResSchema)
    .mutation(
      async ({ input }: { input: z.infer<typeof registerReqSchema> }) => {
        try {
          const user = await createUser({
            name: input.name,
            email: input.email,
            password: input.password,
            role: "USER",
          });
          const token = await generateAccessToken(
            user._id.toString(),
            user.role,
          );
          return {
            message: "User created successfully",
            token,
            status: "success",
          };
        } catch (error) {
          mapToTRPCError(error);
        }
      },
    ),

  login: publicProcedure
    .meta({
      openapi: {
        method: "POST",
        path: "/login",
        description: "Login a user",
        protect: false,
        contentTypes: ["application/json"],
        successDescription: "Login successful",
        errorResponses: [
          400, // Bad Request (validation errors)
          500, // Internal Server Error
          429, // Too Many Requests (rate limiting)
        ],
      },
    })
    .input(loginReqSchema)
    .output(loginResSchema)
    .mutation(async ({ input }: { input: z.infer<typeof loginReqSchema> }) => {
      try {
        const existingUser = await findUserByEmail(input.email);
        if (!existingUser) throw new UnauthorizedError("email not registered");
        const isPasswordValid = await comparePassword(
          input.password,
          existingUser.password as string,
        );
        if (!isPasswordValid) throw new UnauthorizedError("Invalid password");
        // Generate JWT token logic here (e.g., using jsonwebtoken library)
        const token = await generateAccessToken(
          existingUser._id.toString(),
          existingUser.role,
        );
        return {
          message: "Login successful",
          status: "success",
          token,
        };
      } catch (error) {
        mapToTRPCError(error);
      }
    }),
});
