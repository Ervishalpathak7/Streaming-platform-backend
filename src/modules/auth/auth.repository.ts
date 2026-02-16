import { cacheService } from "@common/cache/cache.service";
import { prisma } from "../../common/database/prisma";
import { RegisterInput } from "./auth.schema";

export async function createUser(
  data: RegisterInput & { passwordHash: string },
) {
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: data.passwordHash,
      name: data.name,
    },
  });

  await cacheService.setUser(user);
  return user;
}

export async function findUserByEmail(email: string) {
  const user = await cacheService.getUser(email);
  if (user) return user;

  const userFromDb = await prisma.user.findUnique({
    where: { email },
  });

  if (userFromDb) {
    await cacheService.setUser(userFromDb);
  }

  return userFromDb;
}

export async function findUserById(id: string) {
  const user = await cacheService.getUser(id);
  if (user) return user;

  const userFromDb = await prisma.user.findUnique({
    where: { id },
  });

  if (userFromDb) {
    await cacheService.setUser(userFromDb);
  }

  return userFromDb;
}
