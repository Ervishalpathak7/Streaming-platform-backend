import { FastifyRequest, FastifyReply } from "fastify";
import { verifyToken } from "../../modules/auth/auth.utils";
import { AppError } from "../errors/error-handler";
import { StatusCodes } from "http-status-codes";
import { prisma } from "@common/database/prisma";
import { cacheService } from "@common/cache/cache.service";

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
    const decoded = verifyToken(token) as any;

    const cachedUser = await cacheService.getUser(decoded.id);
    if (cachedUser) {
      request.user = cachedUser;
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) throw new AppError("User not found", StatusCodes.UNAUTHORIZED);

    await cacheService.setUser(user);

    request.user = user;
  } catch (error) {
    throw new AppError("Invalid or expired token", StatusCodes.UNAUTHORIZED);
  }
}

// Enhance FastifyRequest type
declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}
