import { prisma } from "../../common/database/prisma";
import { RegisterInput } from "./auth.schema";

export async function createUser(
  data: RegisterInput & { passwordHash: string },
) {
  return prisma.user.create({
    data: {
      email: data.email,
      password: data.passwordHash,
      name: data.name,
    },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

