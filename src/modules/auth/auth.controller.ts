import { FastifyRequest, FastifyReply } from "fastify";
import { LoginInput, RegisterInput } from "./auth.schema";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "./auth.service";
import { StatusCodes } from "http-status-codes";

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply,
) {
  const { user, accessToken, refreshToken } = await registerUser(request.body);

  reply.setCookie("refreshToken", refreshToken, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

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
  const { user, accessToken, refreshToken } = await loginUser(request.body);

  reply.setCookie("refreshToken", refreshToken, {
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

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
  const refreshToken = request.cookies?.refreshToken;

  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  reply.clearCookie("refreshToken");
  reply.code(StatusCodes.OK).send({
    status: "success",
    message: "Logged out successfully",
  });
}

export async function refreshHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const refreshToken = request.cookies?.refreshToken;
  console.log("Refresh token ", refreshToken);
  if (!refreshToken) {
    return reply.code(StatusCodes.UNAUTHORIZED).send({
      status: "error",
      message: "Refresh token not found",
    });
  }
  const result = await refreshAccessToken(refreshToken);
  reply.header("Authorization", `Bearer ${result.accessToken}`);
  reply.code(StatusCodes.OK).send({
    status: "success",
    message: "Access token refreshed successfully",
  });
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = request.user;
  reply.code(StatusCodes.OK).send({
    status: "success",
    message: "User fetched successfully",
    data: user,
  });
}
