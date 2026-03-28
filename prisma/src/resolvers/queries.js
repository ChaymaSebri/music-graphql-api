const { prisma } = require('../db');

const artistInclude = { genre: true, albums: true, songs: true };
const songInclude   = { album: true, artist: true, genre: true, reviews: true };
const albumInclude  = { artist: true, songs: true };

module.exports = {
  genres:    () => prisma.genre.findMany(),

  artists:   () => prisma.artist.findMany({ include: { genre: true } }),
  artist:    (_, { id }) => prisma.artist.findUnique({ where: { id: +id }, include: artistInclude }),

  albums:    () => prisma.album.findMany({ include: albumInclude }),
  album:     (_, { id }) => prisma.album.findUnique({ where: { id: +id }, include: albumInclude }),

  songs:     () => prisma.song.findMany({ include: { album: true, artist: true, genre: true } }),
  song:      (_, { id }) => prisma.song.findUnique({ where: { id: +id }, include: songInclude }),

  playlists: () => prisma.playlist.findMany({ include: { songs: { include: songInclude } } }),
  playlist:  (_, { id }) => prisma.playlist.findUnique({ where: { id: +id }, include: { songs: { include: songInclude } } }),

  reviews:   (_, { songId }) => prisma.review.findMany({ where: { songId: +songId }, include: { song: true } }),
};