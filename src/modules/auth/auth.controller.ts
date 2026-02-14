import { FastifyRequest, FastifyReply } from "fastify";
import { LoginInput, RegisterInput } from "./auth.schema";
import { registerUser, loginUser, refreshAccessToken } from "./auth.service";
import { StatusCodes } from "http-status-codes";

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply,
) {
  const user = await registerUser(request.body);
  reply.code(StatusCodes.CREATED).send(user);
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply,
) {
  const tokens = await loginUser(request.body);
  reply.code(StatusCodes.OK).send(tokens);
}

export async function logoutHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // If using cookies, clear them here
  // reply.clearCookie('token');
  reply.code(StatusCodes.OK).send({ message: "Logged out successfully" });
}

export async function refreshHandler(
  request: FastifyRequest<{ Body: { refreshToken: string } }>,
  reply: FastifyReply,
) {
  const { refreshToken } = request.body;
  const result = await refreshAccessToken(refreshToken);
  reply.code(StatusCodes.OK).send(result);
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  // request.user is populated by authenticate middleware
  const user = (request as any).user;
  reply.code(StatusCodes.OK).send(user);
}
