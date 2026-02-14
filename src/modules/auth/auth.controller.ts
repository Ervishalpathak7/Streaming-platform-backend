import { FastifyRequest, FastifyReply } from "fastify";
import { LoginInput, RegisterInput } from "./auth.schema";
import { registerUser, loginUser, refreshAccessToken } from "./auth.service";
import { StatusCodes } from "http-status-codes";

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply,
) {
  const { accessToken, refreshToken } = await registerUser(request.body);

  reply.setCookie("refreshToken", refreshToken, {
    path: "/",
    httpOnly: true,
    secure: true, // Always true since we use cookie-secure in prod/dev usually, but check config
    sameSite: "none", // Needed for cross-origin
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Send Access Token in Header
  reply.header("Authorization", `Bearer ${accessToken}`);

  return reply.code(StatusCodes.CREATED).send({
    status: "success",
    message: "User registered successfully",
  });
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply,
) {
  const { accessToken, refreshToken } = await loginUser(request.body);

  reply.setCookie("refreshToken", refreshToken, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  // Send Access Token in Header
  reply.header("Authorization", `Bearer ${accessToken}`);

  return reply.code(StatusCodes.OK).send({
    status: "success",
    message: "Login successful",
  });
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
