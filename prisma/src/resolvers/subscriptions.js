const { pubsub } = require('../pubsub');

module.exports = {
  songAdded:   { subscribe: () => pubsub.asyncIterator(['SONG_ADDED']) },
  songDeleted: { subscribe: () => pubsub.asyncIterator(['SONG_DELETED']) },
  artistAdded: { subscribe: () => pubsub.asyncIterator(['ARTIST_ADDED']) },
  artistSongAdded: {
    subscribe: (_, { artistId }) => pubsub.asyncIterator([`ARTIST_SONG_ADDED_${artistId}`]),
  },
  artistAlbumAdded: {
    subscribe: (_, { artistId }) => pubsub.asyncIterator([`ARTIST_ALBUM_ADDED_${artistId}`]),
  },
  reviewAdded: {
    subscribe: () => pubsub.asyncIterator(['REVIEW_ADDED']),
    resolve:   (payload, { songId }) =>
      !songId || payload.reviewAdded.songId === +songId
        ? payload.reviewAdded
        : null,
  },
  reviewAddedForArtist: {
    subscribe: (_, { artistId }) => pubsub.asyncIterator([`REVIEW_ADDED_FOR_ARTIST_${artistId}`]),
    resolve: (payload) => payload.reviewAddedForArtist,
  },
};