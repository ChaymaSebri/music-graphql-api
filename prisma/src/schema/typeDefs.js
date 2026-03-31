const { gql } = require('graphql-tag');

module.exports = gql`
  # Custom scalar for ISO 8601 datetime strings
  scalar DateTime

  type Genre {
    id:        ID!
    name:      String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Artist {
    id:        ID!
    name:      String!
    bio:       String
    country:   String
    albums(take: Int, skip: Int): [Album!]
    songs(take: Int, skip: Int): [Song!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Album {
    id:        ID!
    title:     String!
    releaseYear: Int!
    coverUrl:  String
    artist:    Artist!
    songs(take: Int, skip: Int): [Song!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Song {
    id:        ID!
    title:     String!
    duration:  Int!
    trackNumber: Int
    album:     Album
    artist:    Artist!
    genre:     Genre!
    reviews(take: Int, skip: Int): [Review!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Playlist {
    id:         ID!
    name:       String!
    description: String
    songs(take: Int, skip: Int): [Song!]
    createdAt:  DateTime!
    updatedAt:  DateTime!
  }

  type Review {
    id:        ID!
    content:   String!
    score:     Int!
    song:      Song!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # ── QUERIES ──────────────────────────────────────
  type Query {
    genres(take: Int, skip: Int): [Genre!]!

    artists(take: Int, skip: Int, filter: ArtistListFilter): [Artist!]!
    artist(id: ID!): Artist

    albums(take: Int, skip: Int): [Album!]!
    album(id:  ID!): Album

    songs(take: Int, skip: Int, filter: SongListFilter): [Song!]!
    song(id:   ID!): Song

    playlists(take: Int, skip: Int): [Playlist!]!
    playlist(id: ID!): Playlist

    reviews(songId: ID!, take: Int, skip: Int): [Review!]!
  }

  input ArtistListFilter {
    name: String
    country: String
  }

  input SongListFilter {
    title: String
    artistName: String
    genreId: ID
    artistId: ID
  }

  input AddGenreInput {
    name: String!
  }

  input DeleteGenreInput {
    id: ID!
  }

  input AddArtistInput {
    name: String!
    country: String
    bio: String
  }

  input UpdateArtistInput {
    id: ID!
    name: String
    country: String
    bio: String
  }

  input DeleteArtistInput {
    id: ID!
  }

  input AddAlbumInput {
    title: String!
    releaseYear: Int!
    artistId: ID!
    coverUrl: String
  }

  input UpdateAlbumInput {
    id: ID!
    title: String
    releaseYear: Int
  }

  input DeleteAlbumInput {
    id: ID!
  }

  input AddSongInput {
    title: String!
    duration: Int!
    albumId: ID
    artistId: ID!
    genreId: ID!
    trackNumber: Int
  }

  input UpdateSongInput {
    id: ID!
    title: String
    duration: Int
  }

  input DeleteSongInput {
    id: ID!
  }

  input AddPlaylistInput {
    name: String!
    description: String
  }

  input PlaylistSongInput {
    playlistId: ID!
    songId: ID!
  }

  input AddReviewInput {
    content: String!
    score: Int!
    songId: ID!
  }

  input DeleteReviewInput {
    id: ID!
  }

  # ── MUTATIONS ────────────────────────────────────
  type Mutation {
    addGenre(input: AddGenreInput!): Genre!
    deleteGenre(input: DeleteGenreInput!): Boolean!

    addArtist(input: AddArtistInput!): Artist!
    updateArtist(input: UpdateArtistInput!): Artist!
    deleteArtist(input: DeleteArtistInput!): Boolean!

    addAlbum(input: AddAlbumInput!): Album!
    updateAlbum(input: UpdateAlbumInput!): Album!
    deleteAlbum(input: DeleteAlbumInput!): Boolean!

    addSong(input: AddSongInput!): Song!
    updateSong(input: UpdateSongInput!): Song!
    deleteSong(input: DeleteSongInput!): Boolean!

    addPlaylist(input: AddPlaylistInput!): Playlist!
    addSongToPlaylist(input: PlaylistSongInput!): Playlist!
    removeSongFromPlaylist(input: PlaylistSongInput!): Playlist!

    addReview(input: AddReviewInput!): Review!
    deleteReview(input: DeleteReviewInput!): Boolean!
  }

  # ── SUBSCRIPTIONS ────────────────────────────────
  type Subscription {
    songAdded:    Song!
    songDeleted:  ID!
    reviewAdded(songId: ID!): Review!
    artistAdded:  Artist!
  }
`;