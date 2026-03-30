const { prisma }  = require('../db');
const { pubsub }  = require('../pubsub');
const { GraphQLError } = require('graphql');

const songInclude   = { album: true, artist: true, genre: true };

function trimOrNull(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new GraphQLError(`${fieldName} must be a non-empty string`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
}

function assertIntRange(value, fieldName, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new GraphQLError(`${fieldName} must be an integer between ${min} and ${max}`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
}

function assertPositiveInt(value, fieldName) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new GraphQLError(`${fieldName} must be a positive integer`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
}

function formatPrismaError(error) {
  if (error && error.code === 'P2002') {
    return new GraphQLError('This record already exists', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (error && error.code === 'P2003') {
    return new GraphQLError('Cannot delete this record because it is still referenced', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  return error;
}

async function assertExists(model, id, entityName) {
  const numericId = +id;
  const row = await model.findUnique({ where: { id: numericId } });

  if (!row) {
    throw new GraphQLError(`${entityName} not found for id=${id}`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  return numericId;
}

module.exports = {
  // ── Genre ──
  addGenre: async (_, { name }) => {
    assertNonEmptyString(name, 'name');

    try {
      return await prisma.genre.create({ data: { name: name.trim() } });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  deleteGenre: async (_, { id }) => {
    await assertExists(prisma.genre, id, 'Genre');

    try {
      await prisma.genre.delete({ where: { id: +id } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Artist ──
  addArtist: async (_, args) => {
    assertNonEmptyString(args.name, 'name');

    const normalizedName = args.name.trim();
    const existingArtist = await prisma.artist.findFirst({
      where: { name: normalizedName },
    });
    if (existingArtist) {
      throw new GraphQLError('Artist already exists', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    try {
      const artist = await prisma.artist.create({
        data: {
          name: normalizedName,
          country: trimOrNull(args.country),
          bio: trimOrNull(args.bio),
        },
      });
      pubsub.publish('ARTIST_ADDED', { artistAdded: artist });
      return artist;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  updateArtist: async (_, { id, ...data }) => {
    await assertExists(prisma.artist, id, 'Artist');

    const updates = {};
    if (data.name !== undefined) {
      assertNonEmptyString(data.name, 'name');
      updates.name = data.name.trim();
    }
    if (data.country !== undefined) updates.country = trimOrNull(data.country);
    if (data.bio !== undefined) updates.bio = trimOrNull(data.bio);

    return prisma.artist.update({ where: { id: +id }, data: updates });
  },
  deleteArtist: async (_, { id }) => {
    await assertExists(prisma.artist, id, 'Artist');

    try {
      await prisma.artist.delete({ where: { id: +id } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Album ──
  addAlbum: async (_, args) => {
    assertNonEmptyString(args.title, 'title');
    assertIntRange(args.releaseYear, 'releaseYear', 1900, new Date().getFullYear() + 1);
    const artistId = await assertExists(prisma.artist, args.artistId, 'Artist');

    const normalizedTitle = args.title.trim();
    const existingAlbum = await prisma.album.findFirst({
      where: { title: normalizedTitle, artistId, releaseYear: args.releaseYear },
    });
    if (existingAlbum) {
      throw new GraphQLError('Album already exists for this artist and release year', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    try {
      return await prisma.album.create({
        data: {
          title: normalizedTitle,
          releaseYear: args.releaseYear,
          artistId,
          coverUrl: trimOrNull(args.coverUrl),
        },
        include: { artist: true, songs: true },
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  updateAlbum: async (_, { id, ...data }) => {
    await assertExists(prisma.album, id, 'Album');

    const updates = {};
    if (data.title !== undefined) {
      assertNonEmptyString(data.title, 'title');
      updates.title = data.title.trim();
    }
    if (data.releaseYear !== undefined) {
      assertIntRange(data.releaseYear, 'releaseYear', 1900, new Date().getFullYear() + 1);
      updates.releaseYear = data.releaseYear;
    }

    return prisma.album.update({ where: { id: +id }, data: updates, include: { artist: true } });
  },
  deleteAlbum: async (_, { id }) => {
    await assertExists(prisma.album, id, 'Album');

    try {
      await prisma.album.delete({ where: { id: +id } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Song ──
  addSong: async (_, args) => {
    assertNonEmptyString(args.title, 'title');
    assertPositiveInt(args.duration, 'duration');
    if (args.trackNumber !== undefined && args.trackNumber !== null) {
      assertPositiveInt(args.trackNumber, 'trackNumber');
    }

    const normalizedTitle = args.title.trim();

    try {
      const song = await prisma.$transaction(async (tx) => {
        // Album is now optional
        let albumId = null;
        if (args.albumId) {
          albumId = await assertExists(tx.album, args.albumId, 'Album');
        }
        
        const artistId = await assertExists(tx.artist, args.artistId, 'Artist');
        const genreId = await assertExists(tx.genre, args.genreId, 'Genre');

        const whereClause = { 
          title: normalizedTitle, 
          artistId
        };
        if (albumId !== null) {
          whereClause.albumId = albumId;
        }

        const existingSong = await tx.song.findFirst({
          where: whereClause,
        });
        if (existingSong) {
          throw new GraphQLError('Song already exists for this artist and album', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }

        let finalTrackNumber = args.trackNumber ?? null;
        if (albumId && finalTrackNumber == null) {
          const lastTrack = await tx.song.findFirst({
            where: { albumId, trackNumber: { not: null } },
            orderBy: { trackNumber: 'desc' },
            select: { trackNumber: true },
          });
          finalTrackNumber = (lastTrack?.trackNumber || 0) + 1;
        } else if (albumId && finalTrackNumber != null) {
          const existingTrack = await tx.song.findFirst({
            where: { albumId, trackNumber: finalTrackNumber },
            select: { id: true },
          });

          if (existingTrack) {
            throw new GraphQLError(`trackNumber ${finalTrackNumber} already exists in this album`, {
              extensions: { code: 'BAD_USER_INPUT' },
            });
          }
        }

        const songData = {
          title: normalizedTitle,
          duration: args.duration,
          trackNumber: finalTrackNumber,
          artistId,
          genreId,
        };

        // Only include albumId if it's not null
        if (albumId !== null) {
          songData.albumId = albumId;
        }

        // Create without include/select, then fetch with proper relations
        const createdSong = await tx.song.create({
          data: songData,
        });

        // Fetch with relations
        const result = await tx.song.findUnique({
          where: { id: createdSong.id },
          include: {
            album: true,
            artist: true,
            genre: true,
          },
        });

        return result;
      });

      pubsub.publish('SONG_ADDED', { songAdded: song });
      return song;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  updateSong: async (_, { id, ...data }) => {
    await assertExists(prisma.song, id, 'Song');

    const updates = {};
    if (data.title !== undefined) {
      assertNonEmptyString(data.title, 'title');
      updates.title = data.title.trim();
    }
    if (data.duration !== undefined) {
      assertPositiveInt(data.duration, 'duration');
      updates.duration = data.duration;
    }

    // Get the song first to check if it has an album
    const song = await prisma.song.findUnique({ where: { id: +id }, select: { albumId: true } });
    
    // Update the song
    const updated = await prisma.song.update({ 
      where: { id: +id }, 
      data: updates, 
    });

    // Fetch with all relations
    const result = await prisma.song.findUnique({
      where: { id: +id },
      include: {
        album: true,
        artist: true,
        genre: true,
      },
    });

    return result;
  },
  deleteSong: async (_, { id }) => {
    const songId = await assertExists(prisma.song, id, 'Song');

    try {
      await prisma.$transaction(async (tx) => {
        // Get the song to find its albumId (if any)
        const song = await tx.song.findUnique({ where: { id: songId }, select: { albumId: true } });
        const albumId = song?.albumId;

        // Delete all reviews associated with this song
        await tx.review.deleteMany({ where: { songId } });

        // Remove song from all playlists (find and update each playlist)
        const playlistsWithSong = await tx.playlist.findMany({
          where: { songs: { some: { id: songId } } },
          select: { id: true },
        });
        
        for (const playlist of playlistsWithSong) {
          await tx.playlist.update({
            where: { id: playlist.id },
            data: { songs: { disconnect: { id: songId } } },
          });
        }

        // Delete the song itself
        await tx.song.delete({ where: { id: songId } });

        // If song belonged to an album, check if it was the last song
        if (albumId) {
          const remainingSongs = await tx.song.count({ where: { albumId } });
          if (remainingSongs === 0) {
            // Delete the album if it has no more songs
            await tx.album.delete({ where: { id: albumId } });
          }
        }
      });

      pubsub.publish('SONG_DELETED', { songDeleted: id });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Playlist ──
  addPlaylist: async (_, args) => {
    assertNonEmptyString(args.name, 'name');

    try {
      return await prisma.playlist.create({
        data: {
          name: args.name.trim(),
          description: trimOrNull(args.description),
        },
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  addSongToPlaylist: async (_, { playlistId, songId }) => {
    const safePlaylistId = await assertExists(prisma.playlist, playlistId, 'Playlist');
    const safeSongId = await assertExists(prisma.song, songId, 'Song');

    return prisma.playlist.update({
      where: { id: safePlaylistId },
      data:  { songs: { connect: { id: safeSongId } } },
      include: { songs: true },
    });
  },
  removeSongFromPlaylist: async (_, { playlistId, songId }) => {
    const safePlaylistId = await assertExists(prisma.playlist, playlistId, 'Playlist');
    const safeSongId = await assertExists(prisma.song, songId, 'Song');

    return prisma.playlist.update({
      where: { id: safePlaylistId },
      data:  { songs: { disconnect: { id: safeSongId } } },
      include: { songs: true },
    });
  },

  // ── Review ──
  addReview: async (_, args) => {
    assertNonEmptyString(args.content, 'content');
    assertIntRange(args.score, 'score', 1, 10);
    const songId = await assertExists(prisma.song, args.songId, 'Song');

    const review = await prisma.review.create({
      data: { content: args.content.trim(), score: args.score, songId },
      include: { song: true },
    });
    pubsub.publish('REVIEW_ADDED', { reviewAdded: review });
    return review;
  },
  deleteReview: async (_, { id }) => {
    await assertExists(prisma.review, id, 'Review');

    try {
      await prisma.review.delete({ where: { id: +id } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
};