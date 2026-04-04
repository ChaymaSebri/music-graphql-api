/*
  Warnings:

  - You are about to drop the column `coverUrl` on the `Album` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `Artist` table. All the data in the column will be lost.
  - You are about to drop the column `trackNumber` on the `Song` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,userId]` on the table `Playlist` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[songId,userId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Playlist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Playlist_name_key";

-- DropIndex
DROP INDEX "Song_albumId_trackNumber_key";

-- AlterTable
ALTER TABLE "Album" DROP COLUMN "coverUrl";

-- AlterTable
ALTER TABLE "Artist" DROP COLUMN "bio",
DROP COLUMN "country",
ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "Playlist" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Song" DROP COLUMN "trackNumber",
ADD COLUMN     "explicit" BOOLEAN,
ADD COLUMN     "popularity" INTEGER;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Playlist_name_userId_key" ON "Playlist"("name", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_songId_userId_key" ON "Review"("songId", "userId");

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
