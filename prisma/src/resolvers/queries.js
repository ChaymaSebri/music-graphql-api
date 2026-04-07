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

function getOrderBy(sort, allowedFields) {
  if (!sort) return STABLE_ORDER_BY;

  const field = String(sort.field || '');
  if (!allowedFields.includes(field)) {
    throw new GraphQLError(`sort.field must be one of: ${allowedFields.join(', ')}`, {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const direction = String(sort.direction || '').toLowerCase();
  if (direction !== 'asc' && direction !== 'desc') {
    throw new GraphQLError('sort.direction must be asc or desc', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  if (field === 'id') {
    return [{ id: direction }];
  }

  return [{ [field]: direction }, { id: 'asc' }];
}

function requireAuth(user) {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
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
    requireAuth(user);
    if (user.role !== 'LISTENER') {
      throw new GraphQLError('This query is available for LISTENER accounts only', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
    // Upsert listener to ensure they exist in the database.
    // Do not eagerly load related data here; field resolvers fetch only what is requested.
    return prisma.listener.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
      },
      update: {},
    });
  },

  genres:    (_, args, { user }) => {
    requireAuth(user);
    const { take, skip } = getPaginationArgs(args);
    const orderBy = getOrderBy(args?.sort, ['name', 'createdAt']);
    return prisma.genre.findMany({
      take,
      skip,
      orderBy,
      include: { _count: { select: { songs: true } } },
    });
  },

  artists:   (_, args, { user }) => {
    requireAuth(user);
    const { take, skip } = getPaginationArgs(args);
    const where = getArtistWhere(args?.filter);
    const orderBy = getOrderBy(args?.sort, ['id', 'name', 'createdAt']);
    return prisma.artist.findMany({
      take,
      skip,
      where,
      orderBy,
      include: { _count: { select: { songs: true, albums: true } } },
    });
  },
  artist:    (_, { id }, { user }) => {
    requireAuth(user);
    return prisma.artist.findUnique({ where: { id: parsePositiveId(id, 'id') } });
  },

  albums:    (_, args, { user }) => {
    requireAuth(user);
    const { take, skip } = getPaginationArgs(args);
    const orderBy = getOrderBy(args?.sort, ['id', 'title', 'releaseYear', 'createdAt']);
    return prisma.album.findMany({
      take,
      skip,
      orderBy,
      include: { _count: { select: { songs: true } } },
    });
  },
  album:     (_, { id }, { user }) => {
    requireAuth(user);
    return prisma.album.findUnique({ where: { id: parsePositiveId(id, 'id') } });
  },

  songs:     (_, args, { user }) => {
    requireAuth(user);
    const { take, skip } = getPaginationArgs(args);
    const where = getSongWhere(args?.filter);
    const orderBy = getOrderBy(args?.sort, ['id', 'title', 'popularity', 'createdAt']);
    return prisma.song.findMany({ take, skip, where, orderBy });
  },
  song:      (_, { id }, { user }) => {
    requireAuth(user);
    return prisma.song.findUnique({ where: { id: parsePositiveId(id, 'id') } });
  },

  playlists: (_, args, { user }) => {
    requireAuth(user);
    const { take, skip } = getPaginationArgs(args);
    const orderBy = getOrderBy(args?.sort, ['id', 'name', 'createdAt']);
    return prisma.playlist.findMany({
      take,
      skip,
      orderBy,
      include: { _count: { select: { songs: true } } },
    });
  },
  playlist:  (_, { id }, { user }) => {
    requireAuth(user);
    return prisma.playlist.findUnique({ where: { id: parsePositiveId(id, 'id') } });
  },

  reviews:   (_, args, { user }) => {
    requireAuth(user);
    const songId = parseIdFilter(args.songId, 'songId');
    const { take, skip } = getPaginationArgs(args);
    const orderBy = getOrderBy(args?.sort, ['id', 'score', 'createdAt']);
    return prisma.review.findMany({ where: { songId }, take, skip, orderBy });
  },

  stats: async (_, __, { user }) => {
    requireAuth(user);
    const [genres, artists, albums, songs, playlists, reviews] = await Promise.all([
      prisma.genre.count(),
      prisma.artist.count(),
      prisma.album.count(),
      prisma.song.count(),
      prisma.playlist.count(),
      prisma.review.count(),
    ]);
    return {
      genres,
      artists,
      albums,
      songs,
      playlists,
      reviews,
    };
  },
};