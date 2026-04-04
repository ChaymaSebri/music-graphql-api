const { prisma } = require('../db');
const { GraphQLError } = require('graphql');

const DEFAULT_TAKE = 50;
const MAX_TAKE = 100;
const STABLE_ORDER_BY = [{ createdAt: 'asc' }, { id: 'asc' }];

function getPaginationArgs(args = {}) {
  const take = args.take == null ? DEFAULT_TAKE : args.take;
  const skip = args.skip == null ? 0 : args.skip;

  if (!Number.isInteger(take) || take <= 0) {
    throw new GraphQLError('take must be a positive integer', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (take > MAX_TAKE) {
    throw new GraphQLError(`take must be less than or equal to ${MAX_TAKE}`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (!Number.isInteger(skip) || skip < 0) {
    throw new GraphQLError('skip must be a non-negative integer', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  return { take, skip };
}

function parseIdFilter(value, fieldName) {
  if (value == null) return undefined;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new GraphQLError(`${fieldName} must be a positive integer`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  return parsed;
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

function getArtistWhere(filter) {
  if (!filter) return undefined;

  const where = {};

  if (filter.name != null) {
    const trimmed = String(filter.name).trim();
    if (trimmed.length) {
      where.name = { contains: trimmed, mode: 'insensitive' };
    }
  }

  if (filter.email != null) {
    const trimmed = String(filter.email).trim();
    if (trimmed.length) {
      where.email = { contains: trimmed, mode: 'insensitive' };
    }
  }

  if (filter.country != null) {
    const trimmed = String(filter.country).trim();
    if (trimmed.length) {
      where.country = { contains: trimmed, mode: 'insensitive' };
    }
  }

  return Object.keys(where).length ? where : undefined;
}

function getSongWhere(filter) {
  if (!filter) return undefined;

  const where = {};

  if (filter.title != null) {
    const trimmed = String(filter.title).trim();
    if (trimmed.length) {
      where.title = { contains: trimmed, mode: 'insensitive' };
    }
  }

  if (filter.artistName != null) {
    const trimmed = String(filter.artistName).trim();
    if (trimmed.length) {
      where.artist = {
        name: { contains: trimmed, mode: 'insensitive' },
      };
    }
  }

  const genreId = parseIdFilter(filter.genreId, 'filter.genreId');
  if (genreId !== undefined) {
    where.genreId = genreId;
  }

  const artistId = parseIdFilter(filter.artistId, 'filter.artistId');
  if (artistId !== undefined) {
    where.artistId = artistId;
  }

  return Object.keys(where).length ? where : undefined;
}

module.exports = {
  me: async (_, __, { user }) => {
    if (!user) {
      throw new GraphQLError('Authentication required', {
        extensions: { code: 'UNAUTHENTICATED' },
      });
    }
    // Upsert listener to ensure they exist in the database
    return prisma.listener.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
      },
      update: {},
      include: {
        playlists: { include: { songs: true } },
        reviews: { include: { song: true } },
      },
    });
  },

  genres:    (_, args) => {
    const { take, skip } = getPaginationArgs(args);
    return prisma.genre.findMany({ take, skip, orderBy: STABLE_ORDER_BY });
  },

  artists:   (_, args) => {
    const { take, skip } = getPaginationArgs(args);
    const where = getArtistWhere(args?.filter);
    return prisma.artist.findMany({ take, skip, where, orderBy: STABLE_ORDER_BY });
  },
  artist:    (_, { id }) => prisma.artist.findUnique({ where: { id: parsePositiveId(id, 'id') } }),

  albums:    (_, args) => {
    const { take, skip } = getPaginationArgs(args);
    return prisma.album.findMany({ take, skip, orderBy: STABLE_ORDER_BY });
  },
  album:     (_, { id }) => prisma.album.findUnique({ where: { id: parsePositiveId(id, 'id') } }),

  songs:     (_, args) => {
    const { take, skip } = getPaginationArgs(args);
    const where = getSongWhere(args?.filter);
    return prisma.song.findMany({ take, skip, where, orderBy: STABLE_ORDER_BY });
  },
  song:      (_, { id }) => prisma.song.findUnique({ where: { id: parsePositiveId(id, 'id') } }),

  playlists: (_, args) => {
    const { take, skip } = getPaginationArgs(args);
    return prisma.playlist.findMany({ take, skip, orderBy: STABLE_ORDER_BY });
  },
  playlist:  (_, { id }) => prisma.playlist.findUnique({ where: { id: parsePositiveId(id, 'id') } }),

  reviews:   (_, args) => {
    const songId = parseIdFilter(args.songId, 'songId');
    const { take, skip } = getPaginationArgs(args);
    return prisma.review.findMany({ where: { songId }, take, skip, orderBy: STABLE_ORDER_BY });
  },

  stats: async () => ({
    genres: await prisma.genre.count(),
    artists: await prisma.artist.count(),
    albums: await prisma.album.count(),
    songs: await prisma.song.count(),
    playlists: await prisma.playlist.count(),
    reviews: await prisma.review.count(),
  }),
};