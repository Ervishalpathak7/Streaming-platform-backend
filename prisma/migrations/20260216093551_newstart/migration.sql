/*
  Warnings:

  - You are about to drop the column `url` on the `Video` table. All the data in the column will be lost.
  - Made the column `filename` on table `Video` required. This step will fail if there are existing NULL values in that column.
  - Made the column `filesize` on table `Video` required. This step will fail if there are existing NULL values in that column.
  - Made the column `filetype` on table `Video` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Video" DROP COLUMN "url",
ADD COLUMN     "playbackUrl" TEXT,
ALTER COLUMN "filename" SET NOT NULL,
ALTER COLUMN "filesize" SET NOT NULL,
ALTER COLUMN "filetype" SET NOT NULL;
