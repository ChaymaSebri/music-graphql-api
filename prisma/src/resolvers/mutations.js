const { prisma }  = require('../db');
const { pubsub }  = require('../pubsub');
const { GraphQLError } = require('graphql');

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

function parsePositiveId(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new GraphQLError(`${fieldName} must be a positive integer`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  return parsed;
}

function requireAuth(user) {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

function withAuth(resolver) {
  return async (parent, args, context, info) => {
    requireAuth(context?.user);
    return resolver(parent, args, context, info);
  };
}

function formatPrismaError(error) {
  if (error && error.code === 'P2002') {
    return new GraphQLError('This record already exists', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (error && error.code === 'P2025') {
    return new GraphQLError('The record you are trying to access does not exist', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (error && error.code === 'P2003') {
    const rawFieldName = String(error?.meta?.field_name || error?.meta?.fieldName || '').toLowerCase();

    let message = 'Cannot perform operation because a referenced record does not exist';
    if (rawFieldName.includes('artistid')) {
      message = 'The specified artist does not exist';
    } else if (rawFieldName.includes('genreid')) {
      message = 'The specified genre does not exist';
    } else if (rawFieldName.includes('albumid')) {
      message = 'The specified album does not exist';
    } else if (rawFieldName.includes('songid')) {
      message = 'The specified song does not exist';
    } else if (rawFieldName.includes('playlistid')) {
      message = 'The specified playlist does not exist';
    }

    return new GraphQLError(message, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  return error;
}

const mutationResolvers = {
  // ── Genre ──
  addGenre: async (_, { input }) => {
    assertNonEmptyString(input.name, 'name');

    try {
      return await prisma.genre.create({ data: { name: input.name.trim() } });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  deleteGenre: async (_, { input }) => {
    try {
      const genreId = parsePositiveId(input.id, 'id');
      await prisma.genre.delete({ where: { id: genreId } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Artist ──
  addArtist: async (_, { input }) => {
    assertNonEmptyString(input.name, 'name');

    const normalizedName = input.name.trim();

    try {
      const artist = await prisma.artist.create({
        data: {
          name: normalizedName,
          country: trimOrNull(input.country),
          bio: trimOrNull(input.bio),
        },
      });
      pubsub.publish('ARTIST_ADDED', { artistAdded: artist });
      return artist;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  updateArtist: async (_, { input }) => {
    const artistId = parsePositiveId(input.id, 'id');
    const updates = {};
    if (input.name !== undefined) {
      assertNonEmptyString(input.name, 'name');
      updates.name = input.name.trim();
    }
    if (input.country !== undefined) updates.country = trimOrNull(input.country);
    if (input.bio !== undefined) updates.bio = trimOrNull(input.bio);

    try {
      return await prisma.artist.update({ where: { id: artistId }, data: updates });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  deleteArtist: async (_, { input }) => {
    try {
      const artistId = parsePositiveId(input.id, 'id');
      await prisma.artist.delete({ where: { id: artistId } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Album ──
  addAlbum: async (_, { input }) => {
    assertNonEmptyString(input.title, 'title');
    assertIntRange(input.releaseYear, 'releaseYear', 1900, new Date().getFullYear() + 1);
    const artistId = parsePositiveId(input.artistId, 'artistId');

    const normalizedTitle = input.title.trim();

    try {
      return await prisma.album.create({
        data: {
          title: normalizedTitle,
          releaseYear: input.releaseYear,
          artistId,
          coverUrl: trimOrNull(input.coverUrl),
        },
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  updateAlbum: async (_, { input }) => {
    const albumId = parsePositiveId(input.id, 'id');
    const updates = {};
    if (input.title !== undefined) {
      assertNonEmptyString(input.title, 'title');
      updates.title = input.title.trim();
    }
    if (input.releaseYear !== undefined) {
      assertIntRange(input.releaseYear, 'releaseYear', 1900, new Date().getFullYear() + 1);
      updates.releaseYear = input.releaseYear;
    }

    try {
      return await prisma.album.update({ where: { id: albumId }, data: updates });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  deleteAlbum: async (_, { input }) => {
    try {
      const albumId = parsePositiveId(input.id, 'id');
      await prisma.album.delete({ where: { id: albumId } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Song ──
  addSong: async (_, { input }) => {
    assertNonEmptyString(input.title, 'title');
    assertPositiveInt(input.duration, 'duration');
    if (input.trackNumber !== undefined && input.trackNumber !== null) {
      assertPositiveInt(input.trackNumber, 'trackNumber');
    }

    const normalizedTitle = input.title.trim();

    try {
      const song = await prisma.$transaction(async (tx) => {
        // Album is now optional
        let albumId = null;
        if (input.albumId != null) {
          albumId = parsePositiveId(input.albumId, 'albumId');
        }

        const artistId = parsePositiveId(input.artistId, 'artistId');
        const genreId = parsePositiveId(input.genreId, 'genreId');

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

        let finalTrackNumber = input.trackNumber ?? null;
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
          duration: input.duration,
          trackNumber: finalTrackNumber,
          artistId,
          genreId,
        };

        // Only include albumId if it's not null
        if (albumId !== null) {
          songData.albumId = albumId;
        }

        // Return base song row; relations are resolved lazily via field resolvers + DataLoader.
        const createdSong = await tx.song.create({
          data: songData,
        });

        return createdSong;
      });

      pubsub.publish('SONG_ADDED', { songAdded: song });
      return song;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  updateSong: async (_, { input }) => {
    const songId = parsePositiveId(input.id, 'id');
    const updates = {};
    if (input.title !== undefined) {
      assertNonEmptyString(input.title, 'title');
      updates.title = input.title.trim();
    }
    if (input.duration !== undefined) {
      assertPositiveInt(input.duration, 'duration');
      updates.duration = input.duration;
    }

    try {
      // Return the updated base song row; relations are resolved lazily via field resolvers.
      return await prisma.song.update({
        where: { id: songId },
        data: updates,
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  deleteSong: async (_, { input }) => {
    const songId = parsePositiveId(input.id, 'id');

    try {
      await prisma.$transaction(async (tx) => {
        // Get the song to find its albumId (if any)
        const song = await tx.song.findUnique({ where: { id: songId }, select: { albumId: true } });
        const albumId = song?.albumId;

        // Delete the song itself; dependent rows are handled by DB-level cascades.
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

      pubsub.publish('SONG_DELETED', { songDeleted: input.id });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Playlist ──
  addPlaylist: async (_, { input }) => {
    assertNonEmptyString(input.name, 'name');

    try {
      return await prisma.playlist.create({
        data: {
          name: input.name.trim(),
          description: trimOrNull(input.description),
        },
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  addSongToPlaylist: async (_, { input }) => {
    const safePlaylistId = parsePositiveId(input.playlistId, 'playlistId');
    const safeSongId = parsePositiveId(input.songId, 'songId');

    try {
      return await prisma.playlist.update({
        where: { id: safePlaylistId },
        data:  { songs: { connect: { id: safeSongId } } },
        include: { songs: true },
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  removeSongFromPlaylist: async (_, { input }) => {
    const safePlaylistId = parsePositiveId(input.playlistId, 'playlistId');
    const safeSongId = parsePositiveId(input.songId, 'songId');

    try {
      const existingLink = await prisma.playlist.findUnique({
        where: { id: safePlaylistId },
        select: {
          id: true,
          songs: {
            where: { id: safeSongId },
            select: { id: true },
          },
        },
      });

      if (!existingLink) {
        throw new GraphQLError('The specified playlist does not exist', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      if (!existingLink.songs.length) {
        throw new GraphQLError('The specified song is not in this playlist', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      return await prisma.playlist.update({
        where: { id: safePlaylistId },
        data:  { songs: { disconnect: { id: safeSongId } } },
        include: { songs: true },
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Review ──
  addReview: async (_, { input }) => {
    assertNonEmptyString(input.content, 'content');
    assertIntRange(input.score, 'score', 1, 10);
    const songId = parsePositiveId(input.songId, 'songId');

    try {
      const review = await prisma.review.create({
        data: { content: input.content.trim(), score: input.score, songId },
        include: { song: true },
      });
      pubsub.publish('REVIEW_ADDED', { reviewAdded: review });
      return review;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  deleteReview: async (_, { input }) => {
    try {
      const reviewId = parsePositiveId(input.id, 'id');
      await prisma.review.delete({ where: { id: reviewId } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
};

module.exports = Object.fromEntries(
  Object.entries(mutationResolvers).map(([name, resolver]) => [name, withAuth(resolver)]),
);