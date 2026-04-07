const queryCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_CACHE_TTL_MS = 20_000;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || 'web_client';
const CLIENT_SECRET = import.meta.env.VITE_CLIENT_SECRET || 'web_secret_key_abc123xyz789';

function getOperationType(query) {
  const normalized = String(query || '').trim().toLowerCase();
  if (normalized.startsWith('mutation')) return 'mutation';
  if (normalized.startsWith('query')) return 'query';
  return 'unknown';
}

function buildCacheKey(query, variables, token) {
  return JSON.stringify({ query, variables, token: token || '' });
}

function getCachedValue(cacheKey) {
  const cached = queryCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    queryCache.delete(cacheKey);
    return null;
  }
  return cached.value;
}

export const clearGraphQLCache = () => {
  queryCache.clear();
};

export const fetchGraphQL = async (query, variables = {}, token, options = {}) => {
  const { ttlMs = DEFAULT_CACHE_TTL_MS, bypassCache = false } = options;
  const operationType = getOperationType(query);
  const shouldUseCache = operationType === 'query' && !bypassCache;
  const cacheKey = buildCacheKey(query, variables, token);

  if (shouldUseCache) {
    const cachedValue = getCachedValue(cacheKey);
    if (cachedValue) {
      return cachedValue;
    }

    const existingInFlight = inFlightRequests.get(cacheKey);
    if (existingInFlight) {
      return existingInFlight;
    }
  }

  const requestPromise = (async () => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Client-ID': CLIENT_ID,
    'X-Client-Secret': CLIENT_SECRET,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  if (operationType === 'mutation') {
    clearGraphQLCache();
  }
  return data.data;
  })();

  if (!shouldUseCache) {
    return requestPromise;
  }

  inFlightRequests.set(cacheKey, requestPromise);
  try {
    const result = await requestPromise;
    queryCache.set(cacheKey, {
      value: result,
      expiresAt: Date.now() + ttlMs,
    });
    return result;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
};

export const LOGIN_MUTATION = `
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      role
      email
    }
  }
`;

export const SIGNUP_MUTATION = `
  mutation Signup($input: SignupInput!) {
    signup(input: $input) {
      token
      role
      email
    }
  }
`;

export const SONGS_QUERY = `
  query GetSongs($skip: Int, $take: Int, $sort: SongSortInput) {
    songs(skip: $skip, take: $take, sort: $sort) {
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
  query GetArtists($skip: Int, $take: Int, $sort: ArtistSortInput) {
    artists(skip: $skip, take: $take, sort: $sort) {
      id
      name
      songCount
    }
  }
`;

export const GENRES_QUERY = `
  query GetGenres($skip: Int, $take: Int, $sort: GenreSortInput) {
    genres(skip: $skip, take: $take, sort: $sort) {
      id
      name
      songCount
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
        songCount
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
        reviewCount
      }
    }
  }
`;

export const GET_TOTAL_SONGS_QUERY = `
  query GetTotalSongs($artistEmail: String!) {
    artists(filter: { email: $artistEmail }, skip: 0, take: 1) {
      songCount
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
        songCount
      }
    }
  }
`;

export const GET_TOTAL_ALBUMS_QUERY = `
  query GetTotalAlbums($artistEmail: String!) {
    artists(filter: { email: $artistEmail }, skip: 0, take: 1) {
      albumCount
    }
  }
`;