-- CreateTable
CREATE TABLE "IdempotencyKey" (
    "key" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("key")
);
