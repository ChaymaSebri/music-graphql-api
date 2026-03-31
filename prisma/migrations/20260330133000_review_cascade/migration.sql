-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_songId_fkey";

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

