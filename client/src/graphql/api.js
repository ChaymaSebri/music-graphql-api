export const fetchGraphQL = async (query, variables = {}, token) => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  return data.data;
};

export const SONGS_QUERY = `
  query GetSongs($skip: Int, $take: Int) {
    songs(skip: $skip, take: $take) {
      id
      title
      duration
      popularity
      explicit
      artist { id name }
      genre { id name }
    }
  }
`;

export const ARTISTS_QUERY = `
  query GetArtists($skip: Int, $take: Int) {
    artists(skip: $skip, take: $take) {
      id
      name
      songs { id }
    }
  }
`;

export const GENRES_QUERY = `
  query GetGenres($skip: Int, $take: Int) {
    genres(skip: $skip, take: $take) {
      id
      name
      songs { id }
    }
  }
`;

export const STATS_QUERY = `
  query GetStats {
    stats {
      songs
      artists
      albums
      genres
    }
  }
`;

export const ADD_SONG_MUTATION = `
  mutation AddSong($input: AddSongInput!) {
    addSong(input: $input) {
      id
      title
      duration
      artist { id name }
      genre { id name }
    }
  }
`;

export const ADD_ALBUM_MUTATION = `
  mutation AddAlbum($input: AddAlbumInput!) {
    addAlbum(input: $input) {
      id
      title
      releaseYear
      artist { id name }
    }
  }
`;

export const GET_MY_PLAYLISTS = `
  query GetMyPlaylists {
    me {
      id
      playlists {
        id
        name
        description
        songs {
          id
          title
          duration
          artist { name }
        }
      }
    }
  }
`;

export const GET_MY_REVIEWS = `
  query GetMyReviews {
    me {
      id
      reviews {
        id
        content
        score
        song {
          id
          title
          artist { name }
        }
      }
    }
  }
`;

export const ADD_PLAYLIST_MUTATION = `
  mutation AddPlaylist($input: AddPlaylistInput!) {
    addPlaylist(input: $input) {
      id
      name
      description
    }
  }
`;

export const ADD_SONG_TO_PLAYLIST_MUTATION = `
  mutation AddSongToPlaylist($input: AddSongToPlaylistInput!) {
    addSongToPlaylist(input: $input) {
      id
      name
    }
  }
`;

export const ADD_REVIEW_MUTATION = `
  mutation AddReview($input: AddReviewInput!) {
    addReview(input: $input) {
      id
      content
      score
      song { id title }
    }
  }
`;

export const DELETE_PLAYLIST_MUTATION = `
  mutation DeletePlaylist($input: DeletePlaylistInput!) {
    deletePlaylist(input: $input)
  }
`;

export const DELETE_REVIEW_MUTATION = `
  mutation DeleteReview($input: DeleteReviewInput!) {
    deleteReview(input: $input)
  }
`;

export const REMOVE_SONG_FROM_PLAYLIST_MUTATION = `
  mutation RemoveSongFromPlaylist($input: AddSongToPlaylistInput!) {
    removeSongFromPlaylist(input: $input) {
      id
      name
      songs { id title }
    }
  }
`;

export const UPDATE_PLAYLIST_MUTATION = `
  mutation UpdatePlaylist($input: UpdatePlaylistInput!) {
    updatePlaylist(input: $input) {
      id
      name
      description
      songs {
        id
        title
        duration
        artist { id name }
      }
    }
  }
`;

export const MY_SONGS_QUERY = `
  query GetMyArtistSongs($artistEmail: String!, $skip: Int, $take: Int) {
    artists(filter: { email: $artistEmail }, skip: 0, take: 1) {
      id
      name
      email
      songs(skip: $skip, take: $take) {
        id
        title
        duration
        popularity
        genre { id name }
        reviews { id score }
      }
    }
  }
`;

export const GET_TOTAL_SONGS_QUERY = `
  query GetTotalSongs($artistEmail: String!) {
    artists(filter: { email: $artistEmail }, skip: 0, take: 1) {
      songs(take: 100) { id }
    }
  }
`;

export const GET_ARTIST_ALBUMS_QUERY = `
  query GetArtistAlbums($artistEmail: String!) {
    artists(filter: { email: $artistEmail }, skip: 0, take: 1) {
      albums(take: 100) {
        id
        title
        releaseYear
      }
    }
  }
`;

export const GET_MY_ALBUMS_QUERY = `
  query GetMyAlbums($artistEmail: String!) {
    artists(filter: { email: $artistEmail }, skip: 0, take: 1) {
      id
      name
      albums(take: 100) {
        id
        title
        releaseYear
        artist { id name }
        songs(take: 100) {
          id
          title
          duration
          genre { id name }
        }
      }
    }
  }
`;

export const GET_TOTAL_ALBUMS_QUERY = `
  query GetTotalAlbums($artistEmail: String!) {
    artists(filter: { email: $artistEmail }, skip: 0, take: 1) {
      albums(take: 100) { id }
    }
  }
`;