const { gql } = require('graphql-tag');

module.exports = gql`
  type Genre {
    id:   ID!
    name: String!
  }

  type Artist {
    id:      ID!
    name:    String!
    bio:     String
    country: String
    albums:  [Album!]
    songs:   [Song!]
  }

  type Album {
    id:          ID!
    title:       String!
    releaseYear: Int!
    coverUrl:    String
    artist:      Artist!
    songs:       [Song!]
  }

  type Song {
    id:          ID!
    title:       String!
    duration:    Int!
    trackNumber: Int
    album:       Album
    artist:      Artist!
    genre:       Genre!
    reviews:     [Review!]
  }

  type Playlist {
    id:          ID!
    name:        String!
    description: String
    songs:       [Song!]
  }

  type Review {
    id:      ID!
    content: String!
    score:   Int!
    song:    Song!
  }

  # ── QUERIES ──────────────────────────────────────
  type Query {
    genres:    [Genre!]!

    artists:   [Artist!]!
    artist(id: ID!): Artist

    albums:    [Album!]!
    album(id:  ID!): Album

    songs:     [Song!]!
    song(id:   ID!): Song

    playlists: [Playlist!]!
    playlist(id: ID!): Playlist

    reviews(songId: ID!): [Review!]!
  }

  # ── MUTATIONS ────────────────────────────────────
  type Mutation {
    addGenre(name: String!): Genre!
    deleteGenre(id: ID!): Boolean!

    addArtist(name: String!, country: String, bio: String): Artist!
    updateArtist(id: ID!, name: String, country: String, bio: String):    Artist!
    deleteArtist(id: ID!): Boolean!

    addAlbum(title: String!, releaseYear: Int!, artistId: ID!, coverUrl: String): Album!
    updateAlbum(id: ID!, title: String, releaseYear: Int): Album!
    deleteAlbum(id: ID!): Boolean!

    addSong(title: String!, duration: Int!, albumId: ID, artistId: ID!, genreId: ID!, trackNumber: Int): Song!
    updateSong(id: ID!, title: String, duration: Int): Song!
    deleteSong(id: ID!): Boolean!

    addPlaylist(name: String!, description: String): Playlist!
    addSongToPlaylist(playlistId: ID!, songId: ID!):    Playlist!
    removeSongFromPlaylist(playlistId: ID!, songId: ID!): Playlist!

    addReview(content: String!, score: Int!, songId: ID!): Review!
    deleteReview(id: ID!): Boolean!
  }

  # ── SUBSCRIPTIONS ────────────────────────────────
  type Subscription {
    songAdded:    Song!
    songDeleted:  ID!
    reviewAdded(songId: ID!): Review!
    artistAdded:  Artist!
  }
`;