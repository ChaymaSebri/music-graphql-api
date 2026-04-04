import {
  isAuthenticated,
  isArtist,
  isListener,
  isAnyUser,
  canCreate,
  canReview,
  canManageContent,
  canDelete,
  isPublic,
} from './permissions.js'

/**
 * GraphQL Shield Schema
 * Defines which rules apply to which operations
 */

export const shield_rules = {
  // ============================================
  // QUERIES - Read Operations
  // ============================================
  Query: {
    // Public queries - no authentication required
    stats: isPublic,
    genres: isPublic,

    // Authenticated queries
    artists: isAuthenticated,
    artist: isAuthenticated,
    albums: isAuthenticated,
    album: isAuthenticated,
    songs: isAuthenticated,
    song: isAuthenticated,
    playlists: isAuthenticated,
    playlist: isAuthenticated,
    reviews: isAuthenticated,
  },

  // ============================================
  // MUTATIONS - Write Operations
  // ============================================
  Mutation: {
    // Genre management (Artists only)
    addGenre: canCreate,
    deleteGenre: canDelete,

    // Artist management
    addArtist: isAuthenticated,
    updateArtist: canManageContent,
    deleteArtist: canDelete,

    // Album management (Artists)
    addAlbum: canCreate,
    updateAlbum: canManageContent,
    deleteAlbum: canDelete,

    // Song management (Artists only)
    addSong: canCreate,
    updateSong: canManageContent,
    deleteSong: canDelete,

    // Playlist management (Any authenticated user)
    addPlaylist: isAuthenticated,
    addSongToPlaylist: isAuthenticated,
    removeSongFromPlaylist: isAuthenticated,

    // Review management (Any authenticated user)
    addReview: isAuthenticated,
    deleteReview: isAuthenticated,
  },

  // ============================================
  // SUBSCRIPTIONS - Real-time Events
  // ============================================
  Subscription: {
    // Everyone subscribed can receive
    songAdded: isAuthenticated,
    songDeleted: isAuthenticated,
    artistAdded: isAuthenticated,
    reviewAdded: isAuthenticated,
  },

  // ============================================
  // TYPE-LEVEL FIELD AUTHORIZATION
  // ============================================
  User: {
    // Sensitive fields (if User type exposed)
    email: isAuthenticated,
  },

  Song: {
    // Explicit content warning (Optional)
    explicit: isPublic,
    popularity: isPublic,
  },

  Review: {
    // Reviews public to read, but auth needed to create
    content: isPublic,
    score: isPublic,
  },
}
