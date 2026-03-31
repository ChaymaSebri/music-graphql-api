-- Enforce uniqueness for songs without album to prevent race-condition duplicates.
CREATE UNIQUE INDEX "Song_title_artist_unique_without_album_idx"
ON "Song"("title", "artistId")
WHERE "albumId" IS NULL;
