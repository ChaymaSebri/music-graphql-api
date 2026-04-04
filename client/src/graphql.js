import { ApolloClient, InMemoryCache, HttpLink, gql } from '@apollo/client';

export const initApolloClient = (token = null) => {
  const httpLink = new HttpLink({
    uri: 'http://localhost:4000/graphql',
    headers: token ? {
      Authorization: `Bearer ${token}`,
    } : {},
    credentials: 'include',
  });

  const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
  });

  return client;
};

export const SONGS_QUERY = gql`
  query GetSongs($skip: Int, $take: Int, $search: String, $sortBy: String) {
    songs(skip: $skip, take: $take, search: $search, sortBy: $sortBy) {
      id
      title
      duration
      artist {
        id
        name
      }
      genre {
        id
        name
      }
      reviews {
        id
        score
      }
    }
  }
`;

export const ARTISTS_QUERY = gql`
  query GetArtists($skip: Int, $take: Int, $search: String) {
    artists(skip: $skip, take: $take, search: $search) {
      id
      name
      songs {
        id
      }
    }
  }
`;

export const GENRES_QUERY = gql`
  query GetGenres($skip: Int, $take: Int) {
    genres(skip: $skip, take: $take) {
      id
      name
      songs {
        id
      }
    }
  }
`;

export const STATS_QUERY = gql`
  query GetStats {
    stats {
      songs
      artists
      albums
      genres
    }
  }
`;
