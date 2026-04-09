const { prisma }  = require('../db');
const { pubsub }  = require('../pubsub');
const { GraphQLError } = require('graphql');
const bcrypt = require('bcryptjs');
const { signAuthToken } = require('../auth');

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

function assertEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new GraphQLError('A valid email is required', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  return email;
}

function assertPassword(value) {
  if (typeof value !== 'string' || value.length < 6) {
    throw new GraphQLError('Password must be at least 6 characters', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }
  return value;
}

/**
 * Require user to be authenticated
 */
function requireAuth(user) {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

/**
 * Require user to be authenticated AND have ARTIST role
 */
function requireArtist(user) {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (user.role !== 'ARTIST') {
    throw new GraphQLError('This action requires ARTIST role', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

/**
 * Require user to be authenticated AND have LISTENER role
 */
function requireListener(user) {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  if (user.role !== 'LISTENER') {
    throw new GraphQLError('This action requires LISTENER role', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
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
    const cause = String(error?.meta?.cause || '').toLowerCase();

    // Check if this is a delete-blocked scenario (record still referenced by others)
    if (cause.includes('foreign key') && 
        (rawFieldName.includes('artist') || cause.includes('artist'))) {
      return new GraphQLError('Cannot delete this artist because it still has songs or albums. Delete those first.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    if (cause.includes('foreign key') && 
        (rawFieldName.includes('album') || cause.includes('album'))) {
      return new GraphQLError('Cannot delete this album because it still has songs. Delete those first.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    if (cause.includes('foreign key') && 
        (rawFieldName.includes('genre') || cause.includes('genre'))) {
      return new GraphQLError('Cannot delete this genre because it still has songs. Delete those first.', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    // Original logic for missing references on INSERT/UPDATE
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
  // ── Auth ──
  login: async (_, { input }) => {
    const email = assertEmail(input.email);
    const password = assertPassword(input.password);

    const artist = await prisma.artist.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });
    const listener = artist
      ? null
      : await prisma.listener.findUnique({
          where: { email },
          select: { id: true, email: true, passwordHash: true },
        });

    const account = artist || listener;
    const role = artist ? 'ARTIST' : listener ? 'LISTENER' : null;

    if (!account || !account.passwordHash) {
      throw new GraphQLError('Invalid email or password', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const isMatch = await bcrypt.compare(password, account.passwordHash);
    if (!isMatch) {
      throw new GraphQLError('Invalid email or password', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }

    const token = signAuthToken({
      sub: String(account.id),
      email: account.email,
      role,
    });

    return { token, role, email: account.email };
  },

  signup: async (_, { input }) => {
    const email = assertEmail(input.email);
    const password = assertPassword(input.password);
    const role = input.role;

    if (role !== 'ARTIST' && role !== 'LISTENER') {
      throw new GraphQLError('Invalid role', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const existingArtist = await prisma.artist.findUnique({ where: { email }, select: { id: true } });
    const existingListener = await prisma.listener.findUnique({ where: { email }, select: { id: true } });
    if (existingArtist || existingListener) {
      throw new GraphQLError('An account with this email already exists', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let created;
    if (role === 'ARTIST') {
      const artistName = String(input.fullName || '').replace(/\s+/g, ' ').trim();
      assertNonEmptyString(artistName, 'fullName');
      created = await prisma.artist.create({
        data: {
          name: artistName,
          email,
          passwordHash,
        },
        select: { id: true, email: true },
      });
    } else {
      const listenerName = trimOrNull(input.fullName) || null;
      created = await prisma.listener.create({
        data: {
          email,
          fullName: listenerName,
          passwordHash,
        },
        select: { id: true, email: true },
      });
    }

    const token = signAuthToken({
      sub: String(created.id),
      email: created.email,
      role,
    });

    return { token, role, email: created.email };
  },

  // ── Genre ── (ARTIST ONLY)
  addGenre: async (_, { input }, { user }) => {
    requireArtist(user);
    assertNonEmptyString(input.name, 'name');

    try {
      return await prisma.genre.create({ data: { name: input.name.trim() } });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  deleteGenre: async (_, { input }, { user }) => {
    requireArtist(user);
    try {
      const genreId = parsePositiveId(input.id, 'id');
      await prisma.genre.delete({ where: { id: genreId } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Artist ── (ARTIST ONLY)
  addArtist: async (_, { input }, { user }) => {
    requireArtist(user);
    assertNonEmptyString(input.name, 'name');

    const normalizedName = input.name.trim();

    try {
      const artist = await prisma.artist.create({
        data: {
          name: normalizedName,
          email: `artist${input.id || Date.now()}@musicdb.com`, // Temporary, will be updated
        },
      });
      
      // Update with correct email based on the generated ID
      const updatedArtist = await prisma.artist.update({
        where: { id: artist.id },
        data: {
          email: `artist${artist.id}@musicdb.com`,
        },
      });
      
      pubsub.publish('ARTIST_ADDED', { artistAdded: updatedArtist });
      return updatedArtist;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  updateArtist: async (_, { input }, { user }) => {
    requireArtist(user);
    const artistId = parsePositiveId(input.id, 'id');
    const updates = {};
    if (input.name !== undefined) {
      assertNonEmptyString(input.name, 'name');
      updates.name = input.name.trim();
    }

    try {
      return await prisma.artist.update({ where: { id: artistId }, data: updates });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  deleteArtist: async (_, { input }, { user }) => {
    requireArtist(user);
    try {
      const artistId = parsePositiveId(input.id, 'id');
      await prisma.artist.delete({ where: { id: artistId } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Album ── (ARTIST ONLY)
  addAlbum: async (_, { input }, { user }) => {
    requireArtist(user);
    assertNonEmptyString(input.title, 'title');
    assertIntRange(input.releaseYear, 'releaseYear', 1900, new Date().getFullYear() + 1);
    const artistId = parsePositiveId(input.artistId, 'artistId');

    const normalizedTitle = input.title.trim();

    try {
      const album = await prisma.album.create({
        data: {
          title: normalizedTitle,
          releaseYear: input.releaseYear,
          artistId,
        },
      });

      pubsub.publish(`ARTIST_ALBUM_ADDED_${artistId}`, { artistAlbumAdded: album });
      return album;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  updateAlbum: async (_, { input }, { user }) => {
    requireArtist(user);
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
  deleteAlbum: async (_, { input }, { user }) => {
    requireArtist(user);
    try {
      const albumId = parsePositiveId(input.id, 'id');
      await prisma.album.delete({ where: { id: albumId } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Song ── (ARTIST ONLY)
  addSong: async (_, { input }, { user }) => {
    requireArtist(user);
    assertNonEmptyString(input.title, 'title');
    assertPositiveInt(input.duration, 'duration');

    const normalizedTitle = input.title.trim();

    try {
      // Album is optional
      let albumId = null;
      if (input.albumId != null) {
        albumId = parsePositiveId(input.albumId, 'albumId');
      }

      const artistId = parsePositiveId(input.artistId, 'artistId');
      const genreId = parsePositiveId(input.genreId, 'genreId');

      const songData = {
        title: normalizedTitle,
        duration: input.duration,
        artistId,
        genreId,
      };

      // Only include albumId if it's not null
      if (albumId !== null) {
        songData.albumId = albumId;
      }

      // Only include explicit if it's provided
      if (input.explicit !== undefined && input.explicit !== null) {
        songData.explicit = input.explicit;
      }

      // Return base song row; relations are resolved lazily via field resolvers + DataLoader.
      const song = await prisma.song.create({
        data: songData,
      });

      pubsub.publish('SONG_ADDED', { songAdded: song });
      pubsub.publish(`ARTIST_SONG_ADDED_${artistId}`, { artistSongAdded: song });
      return song;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  updateSong: async (_, { input }, { user }) => {
    requireArtist(user);
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
    if (Object.keys(updates).length === 0) {
      throw new GraphQLError('At least one field must be updated', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
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
  deleteSong: async (_, { input }, { user }) => {
    requireArtist(user);
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

  // ── Playlist ── (ANY AUTHENTICATED USER)
  addPlaylist: async (_, { input }, { user }) => {
    requireAuth(user);
    assertNonEmptyString(input.name, 'name');

    try {
      // Get the listener's database ID by email
      const dbListener = await prisma.listener.findUnique({
        where: { email: user.email },
        select: { id: true },
      });

      if (!dbListener) {
        throw new GraphQLError('Listener not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      return await prisma.playlist.create({
        data: {
          name: input.name.trim(),
          description: trimOrNull(input.description),
          listenerId: dbListener.id,
        },
        include: { listener: true, songs: true },
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  addSongToPlaylist: async (_, { input }, { user }) => {
    requireAuth(user);
    const safePlaylistId = parsePositiveId(input.playlistId, 'playlistId');
    const safeSongId = parsePositiveId(input.songId, 'songId');

    try {
      return await prisma.playlist.update({
        where: { id: safePlaylistId },
        data:  { songs: { connect: { id: safeSongId } } },
        include: { songs: true, listener: true },
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  removeSongFromPlaylist: async (_, { input }, { user }) => {
    requireAuth(user);
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
        include: { songs: true, listener: true },
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  deletePlaylist: async (_, { input }, { user }) => {
    requireAuth(user);
    const playlistId = parsePositiveId(input.id, 'id');

    try {
      await prisma.playlist.delete({ where: { id: playlistId } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  updatePlaylist: async (_, { input }, { user }) => {
    requireAuth(user);
    const playlistId = parsePositiveId(input.id, 'id');
    assertNonEmptyString(input.name, 'name');

    try {
      return await prisma.playlist.update({
        where: { id: playlistId },
        data: {
          name: input.name.trim(),
          description: trimOrNull(input.description),
        },
        include: { listener: true, songs: true },
      });
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  // ── Review ── (ANY AUTHENTICATED USER)
  addReview: async (_, { input }, { user }) => {
    requireAuth(user);
    assertNonEmptyString(input.content, 'content');
    assertIntRange(input.score, 'score', 1, 10);
    const songId = parsePositiveId(input.songId, 'songId');

    try {
      // Get the listener's database ID by email
      const dbListener = await prisma.listener.findUnique({
        where: { email: user.email },
        select: { id: true },
      });

      if (!dbListener) {
        throw new GraphQLError('Listener not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      const review = await prisma.review.create({
        data: { content: input.content.trim(), score: input.score, songId, listenerId: dbListener.id },
        include: { song: { include: { artist: true } }, listener: true },
      });
      pubsub.publish('REVIEW_ADDED', { reviewAdded: review });
      pubsub.publish(`REVIEW_ADDED_FOR_ARTIST_${review.song.artistId}`, { reviewAddedForArtist: review });
      return review;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },
  deleteReview: async (_, { input }, { user }) => {
    requireAuth(user);
    try {
      const reviewId = parsePositiveId(input.id, 'id');
      await prisma.review.delete({ where: { id: reviewId } });
      return true;
    } catch (error) {
      throw formatPrismaError(error);
    }
  },

  followArtist: async (_, { input }, { user }) => {
    requireListener(user);
    const artistId = parsePositiveId(input.artistId, 'artistId');

    const listener = await prisma.listener.upsert({
      where: { email: user.email },
      create: { email: user.email },
      update: {},
      select: { id: true },
    });

    const artist = await prisma.artist.findUnique({
      where: { id: artistId },
      select: { id: true },
    });

    if (!artist) {
      throw new GraphQLError('The specified artist does not exist', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }

    try {
      await prisma.artistFollow.create({
        data: {
          listenerId: listener.id,
          artistId,
        },
      });
      return true;
    } catch (error) {
      if (error?.code === 'P2002') {
        return true;
      }
      throw formatPrismaError(error);
    }
  },

  unfollowArtist: async (_, { input }, { user }) => {
    requireListener(user);
    const artistId = parsePositiveId(input.artistId, 'artistId');

    const listener = await prisma.listener.findUnique({
      where: { email: user.email },
      select: { id: true },
    });

    if (!listener) {
      return true;
    }

    await prisma.artistFollow.deleteMany({
      where: {
        listenerId: listener.id,
        artistId,
      },
    });

    return true;
  },
};

module.exports = mutationResolvers;
