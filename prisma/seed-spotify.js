require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const csv = require('csv-parser');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const CSV_PATH = path.join(__dirname, 'dataset.csv');

async function main() {
  console.log('🎵 Starting Spotify dataset import...\n');

  // Check if CSV file exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found at: ${CSV_PATH}`);
    console.log('📥 Please:');
    console.log('1. Download spotify-tracks.csv from Kaggle');
    console.log('2. Place it in: prisma/spotify-tracks.csv');
    process.exit(1);
  }

  // Clear existing data
  console.log('🧹 Cleaning database...');
  await prisma.review.deleteMany();
  await prisma.playlist.deleteMany();
  await prisma.song.deleteMany();
  await prisma.album.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.genre.deleteMany();

  const genreMap = new Map();
  const artistMap = new Map();
  const albumMap = new Map();
  let songCount = 0;
  let genreCount = 0;
  let artistCount = 0;
  let albumCount = 0;

  console.log('📖 Reading CSV file...\n');

  // Buffer all rows first
  const rows = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        rows.push(row);
      })
      .on('end', async () => {
        console.log(`📚 Loaded ${rows.length} rows from CSV\n`);
        
        // Process rows sequentially
        for (const row of rows) {
          try {
            // Parse track data
            const trackName = row.track_name?.trim();
            const artistName = row.artists?.trim();
            const albumName = row.album_name?.trim();
            const genreName = row.track_genre?.trim();
            const duration = parseInt(row.duration_ms) || 0;
            const popularity = parseInt(row.popularity) || null;
            const explicit = row.explicit?.toLowerCase() === 'true' || row.explicit === '1';

            // Validate required fields
            if (!trackName || !artistName || !albumName || !genreName) {
              continue;
            }

            // Create/fetch genre
            if (!genreMap.has(genreName)) {
              try {
                const genre = await prisma.genre.create({
                  data: { name: genreName },
                });
                genreMap.set(genreName, genre.id);
                genreCount++;
              } catch (e) {
                const existing = await prisma.genre.findFirst({
                  where: { name: genreName },
                });
                if (existing) {
                  genreMap.set(genreName, existing.id);
                }
              }
            }
            const genreId = genreMap.get(genreName);
            if (!genreId) continue;

            // Create/fetch artist
            if (!artistMap.has(artistName)) {
              try {
                const artist = await prisma.artist.create({
                  data: { name: artistName },
                });
                artistMap.set(artistName, artist.id);
                artistCount++;
              } catch (e) {
                const existing = await prisma.artist.findFirst({
                  where: { name: artistName },
                });
                if (existing) {
                  artistMap.set(artistName, existing.id);
                }
              }
            }
            const artistId = artistMap.get(artistName);
            if (!artistId) continue;

            // Create/fetch album
            const albumKey = `${albumName}|${artistId}`;
            if (!albumMap.has(albumKey)) {
              try {
                const album = await prisma.album.create({
                  data: {
                    title: albumName,
                    releaseYear: 2024,
                    artistId,
                  },
                });
                albumMap.set(albumKey, album.id);
                albumCount++;
              } catch (e) {
                const existing = await prisma.album.findFirst({
                  where: {
                    title: albumName,
                    artistId,
                  },
                });
                if (existing) {
                  albumMap.set(albumKey, existing.id);
                }
              }
            }
            const albumId = albumMap.get(albumKey);
            if (!albumId) continue;

            // Create song
            try {
              await prisma.song.create({
                data: {
                  title: trackName,
                  duration,
                  albumId,
                  artistId,
                  genreId,
                  explicit,
                  popularity,
                },
              });
              songCount++;
            } catch (e) {
              // Skip duplicates
            }

            if (songCount % 1000 === 0) {
              console.log(`✅ Processed ${songCount} songs...`);
            }
          } catch (error) {
            // Continue on error
          }
        }

        console.log('\n✨ Import Summary:');
        console.log(`  🎵 Songs: ${songCount}`);
        console.log(`  🎤 Artists: ${artistCount}`);
        console.log(`  💿 Albums: ${albumCount}`);
        console.log(`  🏷️  Genres: ${genreCount}`);
        console.log('\n✅ Spotify dataset imported successfully!');
        await prisma.$disconnect();
        resolve();
      })
      .on('error', (error) => {
        console.error('❌ CSV parsing error:', error);
        reject(error);
      });
  });
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
