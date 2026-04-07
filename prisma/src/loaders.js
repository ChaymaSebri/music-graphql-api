const DataLoader = require('dataloader');
const { prisma } = require('./db');

// Single place to adapt ID handling if the project migrates from Int IDs to UUIDs.
function normalizeLoaderIds(ids) {
  return ids.map((id) => {
    const normalized = Number(id);
    if (!Number.isInteger(normalized) || normalized <= 0) {
      throw new TypeError(`Invalid ID provided to DataLoader: ${id}`);
    }
    return normalized;
  });
}

function groupRowsByKey(rows, keyName) {
  const map = new Map();
  for (const row of rows) {
    const key = row[keyName];
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function createEntityByIdLoader(model) {
  return new DataLoader(async (ids) => {
    const numericIds = normalizeLoaderIds(ids);
    const rows = await model.findMany({ where: { id: { in: numericIds } } });
    const rowById = new Map(rows.map((row) => [row.id, row]));
    return numericIds.map((id) => rowById.get(id) || null);
  });
}

function createOneToManyLoader(model, foreignKey) {
  return new DataLoader(async (parentIds) => {
    const numericParentIds = normalizeLoaderIds(parentIds);
    const rows = await model.findMany({ where: { [foreignKey]: { in: numericParentIds } } });
    const grouped = groupRowsByKey(rows, foreignKey);
    return numericParentIds.map((id) => grouped.get(id) || []);
  });
}

function createPlaylistSongsLoader() {
  return new DataLoader(async (playlistIds) => {
    const numericPlaylistIds = normalizeLoaderIds(playlistIds);
    const playlists = await prisma.playlist.findMany({
      where: { id: { in: numericPlaylistIds } },
      include: { songs: true },
    });
    const songsByPlaylistId = new Map(playlists.map((playlist) => [playlist.id, playlist.songs]));
    return numericPlaylistIds.map((id) => songsByPlaylistId.get(id) || []);
  });
}

function createLoaders() {
  return {
    artistById: createEntityByIdLoader(prisma.artist),
    albumById: createEntityByIdLoader(prisma.album),
    genreById: createEntityByIdLoader(prisma.genre),
    songById: createEntityByIdLoader(prisma.song),
    listenerPlaylists: createOneToManyLoader(prisma.playlist, 'listenerId'),
    listenerReviews: createOneToManyLoader(prisma.review, 'listenerId'),
    artistAlbums: createOneToManyLoader(prisma.album, 'artistId'),
    artistSongs: createOneToManyLoader(prisma.song, 'artistId'),
    albumSongs: createOneToManyLoader(prisma.song, 'albumId'),
    songReviews: createOneToManyLoader(prisma.review, 'songId'),
    genreSongs: createOneToManyLoader(prisma.song, 'genreId'),
    playlistSongs: createPlaylistSongsLoader(),
  };
}

module.exports = { createLoaders };
