const { gql } = require('graphql-tag');

module.exports = gql`
  # Custom scalar for ISO 8601 datetime strings
  scalar DateTime

  type Listener {
    id:        ID!
    email:     String!
    fullName:  String
    playlists: [Playlist!]
    reviews:   [Review!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Genre {
    id:        ID!
    name:      String!
    songCount: Int!
    songs(take: Int, skip: Int): [Song!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Artist {
    id:        ID!
    name:      String!
    email:     String!
    songCount: Int!
    albumCount: Int!
    albums(take: Int, skip: Int): [Album!]
    songs(take: Int, skip: Int): [Song!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Album {
    id:        ID!
    title:     String!
    releaseYear: Int!
    artist:    Artist!
    songCount: Int!
    songs(take: Int, skip: Int): [Song!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Song {
    id:        ID!
    title:     String!
    duration:  Int!
    album:     Album
    artist:    Artist!
    genre:     Genre!
    explicit:  Boolean
    popularity: Int
    reviewCount: Int!
    reviews(take: Int, skip: Int): [Review!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Playlist {
    id:         ID!
    name:       String!
    description: String
    listener:   Listener!
    songCount:  Int!
    songs(take: Int, skip: Int): [Song!]
    createdAt:  DateTime!
    updatedAt:  DateTime!
  }

  type Review {
    id:        ID!
    content:   String!
    score:     Int!
    song:      Song!
    listener:  Listener!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Statistics {
    genres:    Int!
    artists:   Int!
    albums:    Int!
    songs:     Int!
    playlists: Int!
    reviews:   Int!
  }

  type AuthPayload {
    token: String!
    role: String!
    email: String!
  }

  enum UserRole {
    ARTIST
    LISTENER
  }

  enum SortDirection {
    asc
    desc
  }

  enum GenreSortField {
    name
    createdAt
  }

  enum ArtistSortField {
    id
    name
    createdAt
  }

  enum AlbumSortField {
    id
    title
    releaseYear
    createdAt
  }

  enum SongSortField {
    id
    title
    popularity
    createdAt
  }

  enum PlaylistSortField {
    id
    name
    createdAt
  }

  enum ReviewSortField {
    id
    score
    createdAt
  }

  # ── QUERIES ──────────────────────────────────────
  type Query {
    me: Listener!

    genres(take: Int, skip: Int, sort: GenreSortInput): [Genre!]!

    artists(take: Int, skip: Int, filter: ArtistListFilter, sort: ArtistSortInput): [Artist!]!
    artist(id: ID!): Artist

    albums(take: Int, skip: Int, sort: AlbumSortInput): [Album!]!
    album(id:  ID!): Album

    songs(take: Int, skip: Int, filter: SongListFilter, sort: SongSortInput): [Song!]!
    song(id:   ID!): Song

    playlists(take: Int, skip: Int, sort: PlaylistSortInput): [Playlist!]!
    playlist(id: ID!): Playlist

    reviews(songId: ID!, take: Int, skip: Int, sort: ReviewSortInput): [Review!]!

    stats: Statistics!
  }

  input ArtistListFilter {
    name: String
    email: String
  }

  input SongListFilter {
    title: String
    artistName: String
    genreId: ID
    artistId: ID
  }

  input GenreSortInput {
    field: GenreSortField!
    direction: SortDirection!
  }

  input ArtistSortInput {
    field: ArtistSortField!
    direction: SortDirection!
  }

  input AlbumSortInput {
    field: AlbumSortField!
    direction: SortDirection!
  }

  input SongSortInput {
    field: SongSortField!
    direction: SortDirection!
  }

  input PlaylistSortInput {
    field: PlaylistSortField!
    direction: SortDirection!
  }

  input ReviewSortInput {
    field: ReviewSortField!
    direction: SortDirection!
  }

  input AddGenreInput {
    name: String!
  }

  input DeleteGenreInput {
    id: ID!
  }

  input AddArtistInput {
    name: String!
  }

  input UpdateArtistInput {
    id: ID!
    name: String
  }

  input DeleteArtistInput {
    id: ID!
  }

  input AddAlbumInput {
    title: String!
    releaseYear: Int!
    artistId: ID!
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
    explicit: Boolean
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

  input AddSongToPlaylistInput {
    playlistId: ID!
    songId: ID!
  }

  input DeletePlaylistInput {
    id: ID!
  }

  input UpdatePlaylistInput {
    id: ID!
    name: String!
    description: String
  }

  input AddReviewInput {
    content: String!
    score: Int!
    songId: ID!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input SignupInput {
    email: String!
    password: String!
    role: UserRole!
    fullName: String
  }

  input DeleteReviewInput {
    id: ID!
  }

  # ── MUTATIONS ────────────────────────────────────
  type Mutation {
    login(input: LoginInput!): AuthPayload!
    signup(input: SignupInput!): AuthPayload!

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
    addSongToPlaylist(input: AddSongToPlaylistInput!): Playlist!
    removeSongFromPlaylist(input: AddSongToPlaylistInput!): Playlist!
    deletePlaylist(input: DeletePlaylistInput!): Boolean!
    updatePlaylist(input: UpdatePlaylistInput!): Playlist!

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