/*
  Migration: Separate Listener and Artist tables
  - Rename User table to Listener (for listeners only)
  - Make Artist independent (remove userId FK)
  - Auto-generate emails for artists
  - Migrate playlists/reviews from User to Listener
*/

-- Step 1: Backfill Artist emails (update existing NULL emails)
UPDATE "Artist" SET "email" = 'artist' || "id" || '@musicdb.com' WHERE "email" IS NULL;

-- Step 2: Create Listener table with data from User
ALTER TABLE "User" RENAME TO "Listener";

-- Step 3: Drop the role column from Listener (no longer needed)
ALTER TABLE "Listener" DROP COLUMN "role";

-- Step 4: Drop any artist relationship column from Listener
ALTER TABLE "Listener" DROP COLUMN IF EXISTS "artist";

-- Step 5: Update Playlist to use listenerId instead of userId
ALTER TABLE "Playlist" RENAME COLUMN "userId" TO "listenerId";

-- Step 6: Update Review to use listenerId instead of userId
ALTER TABLE "Review" RENAME COLUMN "userId" TO "listenerId";

-- Step 7: Make Artist.email required
ALTER TABLE "Artist" ALTER COLUMN "email" SET NOT NULL;

-- Step 8: Add unique constraint on Artist.email
CREATE UNIQUE INDEX "Artist_email_key" ON "Artist"("email");

-- Step 9: Drop old indexes on Playlist and Review (will be recreated with new column name)
DROP INDEX "Playlist_name_userId_key";
DROP INDEX "Review_songId_userId_key";

-- Step 10: Create new indexes with listenerId
CREATE UNIQUE INDEX "Playlist_name_listenerId_key" ON "Playlist"("name", "listenerId");
CREATE UNIQUE INDEX "Review_songId_listenerId_key" ON "Review"("songId", "listenerId");

-- Step 11: Update foreign key constraints
ALTER TABLE "Playlist" DROP CONSTRAINT "Playlist_userId_fkey";
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_listenerId_fkey" FOREIGN KEY ("listenerId") REFERENCES "Listener"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";
ALTER TABLE "Review" ADD CONSTRAINT "Review_listenerId_fkey" FOREIGN KEY ("listenerId") REFERENCES "Listener"("id") ON DELETE CASCADE ON UPDATE CASCADE;
