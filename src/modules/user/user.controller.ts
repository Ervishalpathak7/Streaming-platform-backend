import { FastifyRequest, FastifyReply } from "fastify";
import { StatusCodes } from "http-status-codes";

export async function getUserProfileHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const user = request.user!;

  reply.code(StatusCodes.OK).send({
    status: "success",
    message: "Profile fetched successfully",
    data: {
      id: user.id,
      name: user.name || "",
      email: user.email,
    },
  });
}
