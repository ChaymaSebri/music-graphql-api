const { pubsub } = require('../pubsub');

module.exports = {
  songAdded:   { subscribe: () => pubsub.asyncIterator(['SONG_ADDED']) },
  songDeleted: { subscribe: () => pubsub.asyncIterator(['SONG_DELETED']) },
  artistAdded: { subscribe: () => pubsub.asyncIterator(['ARTIST_ADDED']) },
  reviewAdded: {
    subscribe: () => pubsub.asyncIterator(['REVIEW_ADDED']),
    resolve:   (payload, { songId }) =>
      !songId || payload.reviewAdded.songId === +songId
        ? payload.reviewAdded
        : null,
  },
};