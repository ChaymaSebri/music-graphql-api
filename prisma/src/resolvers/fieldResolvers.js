const { GraphQLError } = require('graphql');
const { prisma } = require('../db');

const DEFAULT_TAKE = 50;
const MAX_TAKE = 100;
const STABLE_ORDER_BY = [{ createdAt: 'desc' }, { id: 'desc' }];

function hasPaginationArgs(args = {}) {
  return args.take != null || args.skip != null;
}

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

module.exports = {
  Artist: {
    albums: (artist, args, { loaders }) => {
      if (!hasPaginationArgs(args)) {
        return loaders.artistAlbums.load(artist.id);
      }
      const { take, skip } = getPaginationArgs(args);
      return prisma.album.findMany({ where: { artistId: artist.id }, take, skip, orderBy: STABLE_ORDER_BY });
    },
    songs: (artist, args, { loaders }) => {
      if (!hasPaginationArgs(args)) {
        return loaders.artistSongs.load(artist.id);
      }
      const { take, skip } = getPaginationArgs(args);
      return prisma.song.findMany({ where: { artistId: artist.id }, take, skip, orderBy: STABLE_ORDER_BY });
    },
  },

  Album: {
    artist: (album, _, { loaders }) => loaders.artistById.load(album.artistId),
    songs: (album, args, { loaders }) => {
      if (!hasPaginationArgs(args)) {
        return loaders.albumSongs.load(album.id);
      }
      const { take, skip } = getPaginationArgs(args);
      return prisma.song.findMany({ where: { albumId: album.id }, take, skip, orderBy: STABLE_ORDER_BY });
    },
  },

  Song: {
    album: (song, _, { loaders }) => (song.albumId ? loaders.albumById.load(song.albumId) : null),
    artist: (song, _, { loaders }) => loaders.artistById.load(song.artistId),
    genre: (song, _, { loaders }) => loaders.genreById.load(song.genreId),
    reviews: (song, args, { loaders }) => {
      if (!hasPaginationArgs(args)) {
        return loaders.songReviews.load(song.id);
      }
      const { take, skip } = getPaginationArgs(args);
      return prisma.review.findMany({ where: { songId: song.id }, take, skip, orderBy: STABLE_ORDER_BY });
    },
  },

  Playlist: {
    songs: (playlist, args, { loaders }) => {
      if (!hasPaginationArgs(args)) {
        return loaders.playlistSongs.load(playlist.id);
      }
      const { take, skip } = getPaginationArgs(args);
      return prisma.playlist
        .findUnique({
          where: { id: playlist.id },
          include: {
            songs: {
              take,
              skip,
              orderBy: STABLE_ORDER_BY,
            },
          },
        })
        .then((row) => row?.songs || []);
    },
  },

  Review: {
    song: (review, _, { loaders }) => loaders.songById.load(review.songId),
  },

  Genre: {
    songs: (genre, args, { loaders }) => {
      if (!hasPaginationArgs(args)) {
        return loaders.genreSongs.load(genre.id);
      }
      const { take, skip } = getPaginationArgs(args);
      return prisma.song.findMany({ where: { genreId: genre.id }, take, skip, orderBy: STABLE_ORDER_BY });
    },
  },
};
