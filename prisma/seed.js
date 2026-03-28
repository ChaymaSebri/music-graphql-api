require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const BASE_URL = 'https://musicbrainz.org/ws/2';
const HEADERS = {
  'User-Agent': 'MusicGraphQLProject/1.0 (student@email.com)',
  'Accept': 'application/json',
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function fetchJSON(url) {
  await wait(1100);
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function main() {
  console.log('Nettoyage...');
  await prisma.review.deleteMany();
  await prisma.song.deleteMany();
  await prisma.album.deleteMany();
  await prisma.artist.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.playlist.deleteMany();

  console.log('Création des genres...');
  const genreNames = ['Rock', 'Pop', 'Jazz', 'Hip-Hop', 'Electronic'];
  const genreMap = {};
  for (const name of genreNames) {
    const g = await prisma.genre.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    genreMap[name.toLowerCase()] = g.id;
  }

  const genreTags = [
    { tag: 'rock', key: 'rock' },
    { tag: 'pop',  key: 'pop'  },
    { tag: 'jazz', key: 'jazz' },
  ];

  let allSongs = [];

  for (const { tag, key } of genreTags) {
    const genreId = genreMap[key];
    console.log(`\nFetch artistes — ${tag}`);

    const artistData = await fetchJSON(
      `${BASE_URL}/artist?query=tag:${tag}&limit=4&fmt=json`
    );
    const mbArtists = artistData.artists || [];

    for (const mbArtist of mbArtists) {
      if (!mbArtist.id || !mbArtist.name) continue;
      console.log(`  Artiste: ${mbArtist.name}`);

      const existingArtist = await prisma.artist.findFirst({
        where: { name: mbArtist.name, genreId },
      });
      const artist = existingArtist
        ? await prisma.artist.update({
            where: { id: existingArtist.id },
            data: {
              country: mbArtist.country || null,
              bio: mbArtist.disambiguation || null,
            },
          })
        : await prisma.artist.create({
            data: {
              name: mbArtist.name,
              country: mbArtist.country || null,
              bio: mbArtist.disambiguation || null,
              genreId,
            },
          });

      const albumData = await fetchJSON(
        `${BASE_URL}/release-group?artist=${mbArtist.id}&type=album&limit=2&fmt=json`
      );
      const mbAlbums = albumData['release-groups'] || [];

      for (const mbAlbum of mbAlbums) {
        if (!mbAlbum.id || !mbAlbum.title) continue;
        console.log(`    Album: ${mbAlbum.title}`);

        const releaseYear = parseInt(mbAlbum['first-release-date']?.slice(0, 4)) || 2000;
        const existingAlbum = await prisma.album.findFirst({
          where: { title: mbAlbum.title, artistId: artist.id, releaseYear },
        });
        const album = existingAlbum
          ? existingAlbum
          : await prisma.album.create({
              data: {
                title: mbAlbum.title,
                releaseYear,
                artistId: artist.id,
              },
            });

        const releaseData = await fetchJSON(
          `${BASE_URL}/release?release-group=${mbAlbum.id}&limit=1&fmt=json`
        );
        const release = releaseData.releases?.[0];
        if (!release) continue;

        const trackData = await fetchJSON(
          `${BASE_URL}/release/${release.id}?inc=recordings&fmt=json`
        );
        const tracks = trackData.media?.[0]?.tracks?.slice(0, 5) || [];

        for (const track of tracks) {
          if (!track?.recording?.title) continue;
          console.log(`      Song: ${track.recording.title}`);

          const existingSong = await prisma.song.findFirst({
            where: {
              title: track.recording.title,
              albumId: album.id,
              artistId: artist.id,
            },
          });
          const song = existingSong
            ? await prisma.song.update({
                where: { id: existingSong.id },
                data: {
                  duration: Math.round((track.recording.length || 180000) / 1000),
                  trackNumber: track.position || null,
                  genreId,
                },
              })
            : await prisma.song.create({
                data: {
                  title: track.recording.title,
                  duration: Math.round((track.recording.length || 180000) / 1000),
                  trackNumber: track.position || null,
                  albumId: album.id,
                  artistId: artist.id,
                  genreId,
                },
              });
          allSongs.push(song);
        }
      }
    }
  }

  console.log('\nCréation des playlists...');
  if (allSongs.length >= 4) {
    const p1 = await prisma.playlist.create({
      data: {
        name: 'Best of All Genres',
        description: 'Top picks from every genre',
        songs: { connect: allSongs.slice(0, 4).map(s => ({ id: s.id })) }
      }
    });
    const p2 = await prisma.playlist.create({
      data: {
        name: 'Chill Vibes',
        description: 'Relaxing tracks for studying',
        songs: { connect: allSongs.slice(2, 6).map(s => ({ id: s.id })) }
      }
    });
    console.log(`  Playlist créée: ${p1.name}`);
    console.log(`  Playlist créée: ${p2.name}`);
  }

  console.log('\nAjout des reviews...');
  const reviewTexts = [
    { content: 'Absolument magnifique, un chef-d\'oeuvre !', score: 10 },
    { content: 'Très bon morceau, je l\'écoute en boucle.', score: 9  },
    { content: 'Bonne chanson, bien produite.',              score: 7  },
    { content: 'Correct mais pas exceptionnel.',             score: 6  },
    { content: 'Pas vraiment mon style mais objectivement bon.', score: 5 },
  ];
  for (let i = 0; i < Math.min(5, allSongs.length); i++) {
    await prisma.review.create({
      data: { ...reviewTexts[i], songId: allSongs[i].id }
    });
  }

  console.log(`\nSeed terminé ! ${allSongs.length} songs insérées en base.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());