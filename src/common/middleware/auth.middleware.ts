import { FastifyRequest, FastifyReply } from "fastify";
import { verifyAccessToken } from "../../modules/auth/auth.utils";
import { AppError } from "../errors/error-handler";
import { StatusCodes } from "http-status-codes";
import { findUserById } from "@modules/auth/auth.repository";
import { User } from "@prisma/client";

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authHeader = request?.headers?.authorization;

  if (!authHeader) {
    throw new AppError("No token provided", StatusCodes.UNAUTHORIZED);
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = verifyAccessToken(token) as any;
    if (!decoded) {
      throw new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED);
    }

    if (!request.userCache) request.userCache = new Map();
    let user: User | null | undefined = request.userCache.get(decoded.id);

    if (!user) {
      user = await findUserById(decoded.id);
      if (!user) throw new AppError("User not found", StatusCodes.UNAUTHORIZED);
      request.userCache.set(decoded.id, user);
    }

    request.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
  } catch (error) {
    throw new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED);
  }
}

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      name: string;
    };
    userCache?: Map<string, User>;
  }
}
