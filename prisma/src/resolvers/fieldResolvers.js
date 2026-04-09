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
  Listener: {
    playlists: (listener, _, { loaders }) => loaders.listenerPlaylists.load(listener.id),
    reviews: (listener, _, { loaders }) => loaders.listenerReviews.load(listener.id),
    followedArtists: (listener) =>
      prisma.artist.findMany({
        where: { followers: { some: { listenerId: listener.id } } },
        orderBy: STABLE_ORDER_BY,
      }),
  },

  Artist: {
    songCount: (artist) => {
      if (artist?._count?.songs != null) return artist._count.songs;
      return prisma.song.count({ where: { artistId: artist.id } });
    },
    albumCount: (artist) => {
      if (artist?._count?.albums != null) return artist._count.albums;
      return prisma.album.count({ where: { artistId: artist.id } });
    },
    followersCount: (artist) => {
      if (artist?._count?.followers != null) return artist._count.followers;
      return prisma.artistFollow.count({ where: { artistId: artist.id } });
    },
    followedByMe: async (artist, _, { user }) => {
      if (!user || user.role !== 'LISTENER' || !user.email) return false;

      if (Array.isArray(artist.followers)) {
        return artist.followers.length > 0;
      }

      const listener = await prisma.listener.findUnique({
        where: { email: user.email },
        select: { id: true },
      });

      if (!listener) return false;

      const follow = await prisma.artistFollow.findUnique({
        where: {
          listenerId_artistId: {
            listenerId: listener.id,
            artistId: artist.id,
          },
        },
        select: { artistId: true },
      });

      return !!follow;
    },
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
    songCount: (album) => {
      if (album?._count?.songs != null) return album._count.songs;
      return prisma.song.count({ where: { albumId: album.id } });
    },
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
    reviewCount: (song) => {
      if (song?._count?.reviews != null) return song._count.reviews;
      return prisma.review.count({ where: { songId: song.id } });
    },
    reviews: (song, args, { loaders }) => {
      if (!hasPaginationArgs(args)) {
        return loaders.songReviews.load(song.id);
      }
      const { take, skip } = getPaginationArgs(args);
      return prisma.review.findMany({ where: { songId: song.id }, take, skip, orderBy: STABLE_ORDER_BY });
    },
  },

  Playlist: {
    songCount: (playlist) => {
      if (playlist?._count?.songs != null) return playlist._count.songs;
      return prisma.song.count({
        where: { playlists: { some: { id: playlist.id } } },
      });
    },
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
    songCount: (genre) => {
      if (genre?._count?.songs != null) return genre._count.songs;
      return prisma.song.count({ where: { genreId: genre.id } });
    },
    songs: (genre, args, { loaders }) => {
      if (!hasPaginationArgs(args)) {
        return loaders.genreSongs.load(genre.id);
      }
      const { take, skip } = getPaginationArgs(args);
      return prisma.song.findMany({ where: { genreId: genre.id }, take, skip, orderBy: STABLE_ORDER_BY });
    },
  },
};
