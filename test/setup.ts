import { prisma } from "../src/common/database/prisma";

// Global test setup
beforeAll(async () => {
  // Ensure test database is connected
  await prisma.$connect();
});

// Global test teardown
afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect();
});
