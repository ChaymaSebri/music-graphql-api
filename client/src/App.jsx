import React, { useState, useEffect } from 'react';
import { theme } from './styles/theme.js';
import { useAuth } from './context/AuthContext.jsx';
import { Login } from './components/Login.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Header, Card, Button, SearchInput } from './components/UI.jsx';

// Inject enhanced styles
const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes cardHover {
    0% { transform: translateY(0); }
    100% { transform: translateY(-2px); }
  }

  .page-card {
    animation: fadeUp 0.4s ease both;
    transition: all 0.3s ease;
    border: 1px solid #1a1a1a;
    background: linear-gradient(135deg, #1a1a1a 0%, #161616 100%);
  }

  .page-card:hover {
    border-color: rgba(29, 185, 84, 0.2);
    box-shadow: 0 4px 12px rgba(29, 185, 84, 0.08);
    animation: cardHover 0.3s ease forwards;
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: rgba(29, 185, 84, 0.08);
    border: 1px solid rgba(29, 185, 84, 0.1);
    border-radius: 6px;
    color: #1DB954;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .icon-btn:hover {
    background: rgba(29, 185, 84, 0.15);
    border-color: rgba(29, 185, 84, 0.3);
    transform: scale(1.05);
  }

  .section-header {
    font-family: 'DM Serif Display', serif;
    font-size: 24px;
    font-weight: 400;
    color: #e8ddd0;
    margin-bottom: 8px;
  }

  .section-subtitle {
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #6a6a6a;
    margin-bottom: 24px;
  }
`;
if (!document.head.querySelector('[data-app-styles]')) {
  styleTag.setAttribute('data-app-styles', '');
  document.head.appendChild(styleTag);
}

// SVG Icons
const icons = {
  music: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 12V4l8-2v8"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/></svg>,
  artist: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
  tag: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M4 8h8M6 12h4"/></svg>,
  edit: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 13h12M10 2l3 3L4 14H2v-2z"/></svg>,
  trash: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M6 7v5M10 7v5M3 4l1 9c0 1 1 2 2 2h4c1 0 2-1 2-2l1-9M7 4V2h2v2"/></svg>,
  plus: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 2v12M2 8h12"/></svg>,
  check: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 8l4 4 8-8"/></svg>,
  arrow: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 12l4-4-4-4"/></svg>,
  close: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3l10 10M13 3L3 13"/></svg>,
  playlists: <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 4h12M2 8h6M2 12h4"/><circle cx="12" cy="10" r="2.5"/><path d="M14.5 7.5v5"/></svg>,
};

const fetchGraphQL = async (query, variables = {}, token) => {
  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const data = await response.json();
  if (data.errors) {
    throw new Error(data.errors[0].message);
  }
  return data.data;
};

const SONGS_QUERY = `
  query GetSongs($skip: Int, $take: Int) {
    songs(skip: $skip, take: $take) {
      id
      title
      duration
      popularity
      explicit
      artist {
        id
        name
      }
      genre {
        id
        name
      }
    }
  }
`;

const ARTISTS_QUERY = `
  query GetArtists($skip: Int, $take: Int) {
    artists(skip: $skip, take: $take) {
      id
      name
      songs {
        id
      }
    }
  }
`;

const GENRES_QUERY = `
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

const STATS_QUERY = `
  query GetStats {
    stats {
      songs
      artists
      albums
      genres
    }
  }
`;

const ADD_SONG_MUTATION = `
  mutation AddSong($input: AddSongInput!) {
    addSong(input: $input) {
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
    }
  }
`;

const ADD_ALBUM_MUTATION = `
  mutation AddAlbum($input: AddAlbumInput!) {
    addAlbum(input: $input) {
      id
      title
      releaseYear
      artist {
        id
        name
      }
    }
  }
`;

const GET_MY_PLAYLISTS = `
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
          artist {
            name
          }
        }
      }
    }
  }
`;

const GET_MY_REVIEWS = `
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
          artist {
            name
          }
        }
      }
    }
  }
`;

const ADD_PLAYLIST_MUTATION = `
  mutation AddPlaylist($input: AddPlaylistInput!) {
    addPlaylist(input: $input) {
      id
      name
      description
    }
  }
`;

const ADD_SONG_TO_PLAYLIST_MUTATION = `
  mutation AddSongToPlaylist($input: AddSongToPlaylistInput!) {
    addSongToPlaylist(input: $input) {
      id
      name
    }
  }
`;

const ADD_REVIEW_MUTATION = `
  mutation AddReview($input: AddReviewInput!) {
    addReview(input: $input) {
      id
      content
      score
      song {
        id
        title
      }
    }
  }
`;

const DELETE_PLAYLIST_MUTATION = `
  mutation DeletePlaylist($input: DeletePlaylistInput!) {
    deletePlaylist(input: $input)
  }
`;

const DELETE_REVIEW_MUTATION = `
  mutation DeleteReview($input: DeleteReviewInput!) {
    deleteReview(input: $input)
  }
`;

const REMOVE_SONG_FROM_PLAYLIST_MUTATION = `
  mutation RemoveSongFromPlaylist($input: AddSongToPlaylistInput!) {
    removeSongFromPlaylist(input: $input) {
      id
      name
      songs {
        id
        title
      }
    }
  }
`;

const UPDATE_PLAYLIST_MUTATION = `
  mutation UpdatePlaylist($input: UpdatePlaylistInput!) {
    updatePlaylist(input: $input) {
      id
      name
      description
      songs {
        id
        title
        duration
        artist {
          id
          name
        }
      }
    }
  }
`;

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchGraphQL(STATS_QUERY, {}, token);
        setStats(data.stats);
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [token]);

  if (loading) {
    return (
      <div style={{ padding: theme.spacing.lg }}>
        <p style={{ color: theme.colors.textSecondary }}>Loading statistics...</p>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Songs', value: stats.songs, icon: icons.music },
    { label: 'Artists', value: stats.artists, icon: icons.artist },
    { label: 'Albums', value: stats.albums, icon: icons.tag },
    { label: 'Genres', value: stats.genres, icon: icons.tag },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Header title="Dashboard" subtitle="Welcome to MusicDB API Client" />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: theme.spacing.lg,
          padding: `${theme.spacing.lg}`,
        }}
      >
        {statCards.map((card, idx) => (
          <Card 
            key={card.label}
            style={{ 
              animationDelay: `${idx * 0.08}s`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
            className="page-card"
          >
            <div style={{ 
              width: 40, 
              height: 40, 
              marginBottom: theme.spacing.md,
              color: theme.colors.primary,
              opacity: 0.7,
            }}>
              {card.icon}
            </div>
            <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, marginBottom: theme.spacing.xs, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              {card.label}
            </p>
            <p style={{ fontSize: theme.fontSizes['3xl'], fontWeight: 'bold', color: theme.colors.primary }}>
              {card.value.toLocaleString()}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
};

const Songs = ({ token, role, onSongClick }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        const data = await fetchGraphQL(
          SONGS_QUERY,
          { skip, take: ITEMS_PER_PAGE },
          token
        );
        setSongs(data.songs);
      } catch (err) {
        console.error('Error loading songs:', err);
      } finally {
        setLoading(false);
      }
    };
    loadSongs();
  }, [skip, token]);

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const songCardStyle = role === 'LISTENER' ? {
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  } : {};

  const handleSongClick = (song) => {
    if (role === 'LISTENER' && onSongClick) {
      onSongClick(song);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <Header title="Songs" subtitle={`Showing songs ${(skip + 1).toLocaleString()} - ${Math.min(skip + ITEMS_PER_PAGE, skip + ITEMS_PER_PAGE).toLocaleString()}`} />

      <div style={{ padding: theme.spacing.lg }}>
        {loading ? (
          <p style={{ color: theme.colors.textSecondary }}>Loading songs...</p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              {songs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handleSongClick(song)}
                  onMouseEnter={(e) => {
                    if (role === 'LISTENER') {
                      e.currentTarget.style.backgroundColor = theme.colors.cardBg;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (role === 'LISTENER') {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                  style={{
                    borderRadius: theme.borderRadius.md,
                    ...songCardStyle,
                  }}
                >
                  <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: theme.spacing.md }}>
                      <div>
                        <h3 style={{ fontSize: theme.fontSizes.lg, fontWeight: 'bold', marginBottom: theme.spacing.sm }}>
                          {song.title}
                        </h3>
                        <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, marginBottom: theme.spacing.xs }}>
                          By <span style={{ color: theme.colors.primary }}>{song.artist.name}</span>
                        </p>
                        <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
                          Genre: {song.genre.name}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: theme.fontSizes.lg, fontWeight: 'bold' }}>
                          {formatDuration(song.duration)}
                        </p>
                        <p style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.xs, fontSize: theme.fontSizes.sm }}>
                          Popularity: <span style={{ color: theme.colors.primary }}>{song.popularity ?? 'N/A'}</span>
                        </p>
                        <p style={{ color: theme.colors.textSecondary, marginTop: theme.spacing.xs, fontSize: theme.fontSizes.sm, display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                          <span style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: song.explicit ? '#e05555' : '#1DB954' }}>
                            {song.explicit ? icons.close : icons.check}
                          </span>
                          {song.explicit ? 'Explicit' : 'Clean'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.lg, justifyContent: 'center' }}>
              <Button onClick={() => setSkip(Math.max(0, skip - ITEMS_PER_PAGE))} disabled={skip === 0}>
                Previous
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', color: theme.colors.textSecondary }}>
                Page {Math.floor(skip / ITEMS_PER_PAGE) + 1}
              </span>
              <Button onClick={() => setSkip(skip + ITEMS_PER_PAGE)}>
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Artists = ({ token }) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const loadArtists = async () => {
      try {
        setLoading(true);
        const data = await fetchGraphQL(
          ARTISTS_QUERY,
          { skip, take: ITEMS_PER_PAGE },
          token
        );
        setArtists(data.artists);
      } catch (err) {
        console.error('Error loading artists:', err);
      } finally {
        setLoading(false);
      }
    };
    loadArtists();
  }, [skip, token]);

  return (
    <div style={{ width: '100%' }}>
      <Header title="Artists" subtitle="Browse all artists in the database" />

      <div style={{ padding: theme.spacing.lg }}>
        {loading ? (
          <p style={{ color: theme.colors.textSecondary }}>Loading artists...</p>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: theme.spacing.lg,
            }}>
              {artists.map((artist) => (
                <Card key={artist.id}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: theme.fontSizes.lg, fontWeight: 'bold', marginBottom: theme.spacing.sm }}>
                      {artist.name}
                    </h3>
                    <p style={{ color: theme.colors.primary }}>
                      {artist.songs.length} songs
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.lg, justifyContent: 'center' }}>
              <Button onClick={() => setSkip(Math.max(0, skip - ITEMS_PER_PAGE))} disabled={skip === 0}>
                Previous
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', color: theme.colors.textSecondary }}>
                Page {Math.floor(skip / ITEMS_PER_PAGE) + 1}
              </span>
              <Button onClick={() => setSkip(skip + ITEMS_PER_PAGE)}>
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Genres = ({ token }) => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);

  const ITEMS_PER_PAGE = 15;

  useEffect(() => {
    const loadGenres = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchGraphQL(
          GENRES_QUERY,
          { skip, take: ITEMS_PER_PAGE },
          token
        );
        console.log('Genres data:', data);
        setGenres(data.genres || []);
      } catch (err) {
        console.error('Error loading genres:', err);
        setError(err.message);
        setGenres([]);
      } finally {
        setLoading(false);
      }
    };
    loadGenres();
  }, [skip, token]);

  return (
    <div style={{ width: '100%' }}>
      <Header title="Genres" subtitle="All music genres in our database" />

      <div style={{ padding: theme.spacing.lg }}>
        {error && (
          <div style={{ backgroundColor: '#c41e3a', color: '#fff', padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.lg }}>
            Error: {error}
          </div>
        )}
        {loading ? (
          <p style={{ color: theme.colors.textSecondary }}>Loading genres...</p>
        ) : genres.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary }}>No genres found</p>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: theme.spacing.md,
            }}>
              {genres.map((genre) => (
                <Card key={genre.id}>
                  <div style={{ textAlign: 'center' }}>
                    <h3 style={{ fontSize: theme.fontSizes.base, fontWeight: 'bold', marginBottom: theme.spacing.xs }}>
                      {genre.name}
                    </h3>
                    <p style={{ color: theme.colors.primary, fontSize: theme.fontSizes.sm }}>
                      {genre.songs.length} songs
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.lg, justifyContent: 'center' }}>
              <Button onClick={() => setSkip(Math.max(0, skip - ITEMS_PER_PAGE))} disabled={skip === 0}>
                Previous
              </Button>
              <span style={{ display: 'flex', alignItems: 'center', color: theme.colors.textSecondary }}>
                Page {Math.floor(skip / ITEMS_PER_PAGE) + 1}
              </span>
              <Button onClick={() => setSkip(skip + ITEMS_PER_PAGE)}>
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const MY_SONGS_QUERY = `
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
  }
`;

const MySongs = ({ token }) => {
  const { email } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [artistName, setArtistName] = useState('Your Songs');
  const [hasMore, setHasMore] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [genres, setGenres] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', duration: '', genreId: '', albumId: '', explicit: false });
  const [artistId, setArtistId] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [totalSongCount, setTotalSongCount] = useState(0);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const loadSongs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await fetchGraphQL(
          MY_SONGS_QUERY,
          { artistEmail: email, skip, take: ITEMS_PER_PAGE + 1 },
          token
        );
        
        const artists = data.artists || [];
        const artist = artists.length > 0 ? artists[0] : null;
        
        if (artist) {
          setArtistId(artist.id);
          setArtistName(artist.name);
          const allSongs = artist.songs || [];
          setHasMore(allSongs.length > ITEMS_PER_PAGE);
          setSongs(allSongs.slice(0, ITEMS_PER_PAGE));
          
          // Get total count of all songs for this artist
          const countData = await fetchGraphQL(
            `query GetTotalSongs($artistEmail: String!) {
              artists(filter: { email: $artistEmail }, skip: 0, take: 1) {
                songs(take: 100) {
                  id
                }
              }
            }`,
            { artistEmail: email },
            token
          );
          const totalCount = countData.artists?.[0]?.songs?.length || 0;
          setTotalSongCount(totalCount);
        } else {
          setSongs([]);
          setHasMore(false);
          setTotalSongCount(0);
          setError('No artist profile found. Please create an artist profile first.');
        }
      } catch (err) {
        console.error('Error loading my songs:', err);
        setError(err.message);
        setSongs([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    loadSongs();
  }, [skip, token, email, refresh]);

  useEffect(() => {
    if (showAddForm) {
      const loadData = async () => {
        try {
          const genresData = await fetchGraphQL(GENRES_QUERY, { skip: 0, take: 100 }, token);
          // Only load albums for the current artist (by email)
          const albumsData = await fetchGraphQL(
            `query GetArtistAlbums($artistEmail: String!) { 
              artists(filter: { email: $artistEmail }, skip: 0, take: 1) { 
                albums(take: 100) { 
                  id 
                  title 
                  releaseYear 
                } 
              } 
            }`,
            { artistEmail: email },
            token
          );
          setGenres(genresData.genres || []);
          const fetchedAlbums = albumsData.artists?.[0]?.albums || [];
          console.log('Fetched albums:', fetchedAlbums);
          setAlbums(fetchedAlbums);
        } catch (err) {
          console.error('Error loading genres and albums:', err);
        }
      };
      loadData();
    }
  }, [showAddForm, token, email]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.duration || !formData.genreId) {
      alert('Title, duration, and genre are required');
      return;
    }

    if (!artistId) {
      alert('Unable to determine your artist ID. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        title: formData.title.trim(),
        duration: parseInt(formData.duration),
        genreId: formData.genreId,
        artistId: artistId,
        explicit: formData.explicit,
      };
      if (formData.albumId) input.albumId = formData.albumId;

      const result = await fetchGraphQL(ADD_SONG_MUTATION, { input }, token);
      if (result.addSong) {
        setFormData({ title: '', duration: '', genreId: '', albumId: '', explicit: false });
        setShowAddForm(false);
        setSkip(0);
        setRefresh(prev => prev + 1);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const avgScore = (reviews) => {
    if (reviews.length === 0) return 'No ratings';
    const avg = (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1);
    return `${avg}/10`;
  };

  return (
    <div>
      <Header title="My Songs" subtitle={`Your uploaded songs (${totalSongCount})`} />

      <div style={{ padding: theme.spacing.lg }}>
        {error && !showAddForm && (
          <div style={{ backgroundColor: '#c41e3a', color: '#fff', padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.lg }}>
            Error: {error}
          </div>
        )}

        {!showAddForm ? (
          <>
            <div style={{ marginBottom: theme.spacing.lg }}>
              <Button onClick={() => setShowAddForm(true)} style={{ backgroundColor: theme.colors.primary, color: '#000' }}>
                Add Song
              </Button>
            </div>

            {loading ? (
              <p style={{ color: theme.colors.textSecondary }}>Loading your songs...</p>
            ) : songs.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary }}>You haven't uploaded any songs yet. Click "Add Song" to get started!</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                  {songs.map((song) => (
                    <Card key={song.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: theme.spacing.md }}>
                        <div>
                          <h3 style={{ fontSize: theme.fontSizes.lg, fontWeight: 'bold', marginBottom: theme.spacing.sm }}>
                            {song.title}
                          </h3>
                          <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, marginBottom: theme.spacing.xs }}>
                            Genre: <span style={{ color: theme.colors.primary }}>{song.genre.name}</span>
                          </p>
                          {song.popularity !== null && song.popularity !== undefined && (
                            <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
                              Popularity: <span style={{ color: theme.colors.primary, fontWeight: 'bold' }}>{song.popularity}</span>
                            </p>
                          )}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: theme.spacing.xs }}>
                            {formatDuration(song.duration)}
                          </p>
                          <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
                            {avgScore(song.reviews)}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {(skip > 0 || hasMore) && (
                  <div style={{ display: 'flex', gap: theme.spacing.md, marginTop: theme.spacing.lg, justifyContent: 'center' }}>
                    <Button onClick={() => setSkip(Math.max(0, skip - ITEMS_PER_PAGE))} disabled={skip === 0}>
                      Previous
                    </Button>
                    <span style={{ display: 'flex', alignItems: 'center', color: theme.colors.textSecondary }}>
                      Page {Math.floor(skip / ITEMS_PER_PAGE) + 1}
                    </span>
                    <Button onClick={() => setSkip(skip + ITEMS_PER_PAGE)} disabled={!hasMore}>
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <Card>
            <div style={{ marginBottom: theme.spacing.lg }}>
              <Button onClick={() => setShowAddForm(false)} style={{ backgroundColor: theme.colors.textSecondary }}>
                Back to Songs
              </Button>
            </div>

            <form onSubmit={handleAddSong} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              <h2 style={{ fontSize: theme.fontSizes.lg, fontWeight: 'bold' }}>Add New Song</h2>

              <div>
                <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: 'bold', color: theme.colors.text }}>
                  Song Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Enter song title"
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.darkBg,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.cardBg}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSizes.base,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: 'bold', color: theme.colors.text }}>
                  Duration (milliseconds)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleFormChange}
                  placeholder="e.g., 240000 (4 minutes)"
                  min="1"
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.darkBg,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.cardBg}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSizes.base,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: 'bold', color: theme.colors.text }}>
                  Genre
                </label>
                <select
                  name="genreId"
                  value={formData.genreId}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.darkBg,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.cardBg}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSizes.base,
                  }}
                >
                  <option value="">Select a genre</option>
                  {genres.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: 'bold', color: theme.colors.text }}>
                  Album (Optional)
                </label>
                <select
                  name="albumId"
                  value={formData.albumId}
                  onChange={handleFormChange}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.darkBg,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.cardBg}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSizes.base,
                  }}
                >
                  <option value="">No album</option>
                  {albums.map(a => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, fontWeight: 'bold', color: theme.colors.text, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="explicit"
                    checked={formData.explicit}
                    onChange={(e) => setFormData(prev => ({ ...prev, explicit: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Mark as Explicit Content</span>
                </label>
              </div>

              <Button
                onClick={handleAddSong}
                disabled={submitting}
                style={{
                  marginTop: theme.spacing.md,
                  backgroundColor: submitting ? theme.colors.textSecondary : theme.colors.primary,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Uploading...' : 'Upload Song'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

const MyAlbums = ({ token }) => {
  const { email } = useAuth();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', releaseYear: new Date().getFullYear() });
  const [artistId, setArtistId] = useState(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState(null);
  const [totalAlbumCount, setTotalAlbumCount] = useState(0);

  useEffect(() => {
    const loadMyAlbums = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const albumData = await fetchGraphQL(
          `query GetMyAlbums($artistEmail: String!) { 
            artists(filter: { email: $artistEmail }, skip: 0, take: 1) { 
              id
              name
              albums(take: 100) { 
                id 
                title 
                releaseYear 
                artist {
                  id
                  name
                }
                songs(take: 100) {
                  id
                  title
                  duration
                  genre {
                    id
                    name
                  }
                }
              } 
            } 
          }`,
          { artistEmail: email },
          token
        );
        
        const artists = albumData.artists || [];
        const artist = artists.length > 0 ? artists[0] : null;
        
        if (artist) {
          setArtistId(artist.id);
          setAlbums(artist.albums || []);
          
          // Get total count of all albums for this artist
          const countData = await fetchGraphQL(
            `query GetTotalAlbums($artistEmail: String!) {
              artists(filter: { email: $artistEmail }, skip: 0, take: 1) {
                albums(take: 100) {
                  id
                }
              }
            }`,
            { artistEmail: email },
            token
          );
          const totalCount = countData.artists?.[0]?.albums?.length || 0;
          setTotalAlbumCount(totalCount);
        } else {
          setAlbums([]);
          setTotalAlbumCount(0);
        }
      } catch (err) {
        console.error('Error loading albums:', err);
        setError(err.message);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };
    loadMyAlbums();
  }, [token, email]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'releaseYear' ? parseInt(value) : value
    }));
  };

  const handleAddAlbum = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Album title is required');
      return;
    }

    if (formData.releaseYear < 1900 || formData.releaseYear > new Date().getFullYear() + 1) {
      alert('Release year must be between 1900 and ' + (new Date().getFullYear() + 1));
      return;
    }

    if (!artistId) {
      alert('Unable to determine your artist ID. Please refresh and try again.');
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        title: formData.title.trim(),
        releaseYear: formData.releaseYear,
        artistId: artistId,
      };

      const result = await fetchGraphQL(ADD_ALBUM_MUTATION, { input }, token);
      if (result.addAlbum) {
        setFormData({ title: '', releaseYear: new Date().getFullYear() });
        setShowAddForm(false);
        // Reload my albums using artist email
        const albumData = await fetchGraphQL(
          `query GetMyAlbums($artistEmail: String!) { 
            artists(filter: { email: $artistEmail }, skip: 0, take: 1) { 
              albums(take: 100) { 
                id 
                title 
                releaseYear 
                artist {
                  id
                  name
                }
              } 
            } 
          }`,
          { artistEmail: email },
          token
        );
        
        const albums = albumData.artists?.[0]?.albums || [];
        setAlbums(albums);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Header title="My Albums" subtitle={`Your music albums and discography (${totalAlbumCount})`} />

      <div style={{ padding: theme.spacing.lg }}>
        {error && !showAddForm && (
          <div style={{ backgroundColor: '#c41e3a', color: '#fff', padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.lg }}>
            Error: {error}
          </div>
        )}

        {!showAddForm ? (
          <>
            <div style={{ marginBottom: theme.spacing.lg }}>
              <Button onClick={() => setShowAddForm(true)} style={{ backgroundColor: theme.colors.primary, color: '#000' }}>
                Create Album
              </Button>
            </div>

            {loading ? (
              <p style={{ color: theme.colors.textSecondary }}>Loading your albums...</p>
            ) : albums.length === 0 ? (
              <p style={{ color: theme.colors.textSecondary }}>You haven't created any albums yet. Click "Create Album" to get started!</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: theme.spacing.md }}>
                {albums.map((album) => (
                  <div key={album.id}>
                    <Card
                      onClick={() => setSelectedAlbumId(selectedAlbumId === album.id ? null : album.id)}
                      style={{ cursor: 'pointer', opacity: selectedAlbumId === album.id ? 0.8 : 1, transition: 'opacity 0.2s' }}
                    >
                      <h3 style={{ fontSize: theme.fontSizes.base, fontWeight: 'bold', marginBottom: theme.spacing.sm }}>
                        {album.title}
                      </h3>
                      <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, marginBottom: theme.spacing.xs }}>
                        {album.releaseYear} • {album.songs?.length || 0} songs
                      </p>
                      <p style={{ color: theme.colors.primary, fontSize: theme.fontSizes.sm }}>
                        {album.artist.name}
                      </p>
                    </Card>

                    {selectedAlbumId === album.id && album.songs && album.songs.length > 0 && (
                      <Card style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.darkBg, borderLeft: `4px solid ${theme.colors.primary}` }}>
                        <div style={{ marginBottom: theme.spacing.md }}>
                          <h4 style={{ fontSize: theme.fontSizes.base, fontWeight: 'bold', marginBottom: theme.spacing.sm, color: theme.colors.primary }}>
                            Songs in "{album.title}"
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                            {album.songs.map((song) => (
                              <div
                                key={song.id}
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  padding: theme.spacing.sm,
                                  backgroundColor: theme.colors.cardBg,
                                  borderRadius: theme.borderRadius.sm,
                                  fontSize: theme.fontSizes.sm,
                                }}
                              >
                                <div>
                                  <p style={{ fontWeight: 'bold', marginBottom: '2px' }}>
                                    {song.title}
                                  </p>
                                  <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.xs }}>
                                    {song.genre?.name} • {Math.floor(song.duration / 60)}:{String(song.duration % 60).padStart(2, '0')}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Card>
                    )}

                    {selectedAlbumId === album.id && (!album.songs || album.songs.length === 0) && (
                      <Card style={{ marginTop: theme.spacing.md, backgroundColor: theme.colors.darkBg }}>
                        <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
                          No songs in this album yet.
                        </p>
                      </Card>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <Card>
            <div style={{ marginBottom: theme.spacing.lg }}>
              <Button onClick={() => setShowAddForm(false)} style={{ backgroundColor: theme.colors.textSecondary }}>
                Back to Albums
              </Button>
            </div>

            <form onSubmit={handleAddAlbum} style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
              <h2 style={{ fontSize: theme.fontSizes.lg, fontWeight: 'bold' }}>Create New Album</h2>

              <div>
                <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: 'bold', color: theme.colors.text }}>
                  Album Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Enter album title"
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.darkBg,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.cardBg}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSizes.base,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: theme.spacing.sm, fontWeight: 'bold', color: theme.colors.text }}>
                  Release Year
                </label>
                <input
                  type="number"
                  name="releaseYear"
                  value={formData.releaseYear}
                  onChange={handleFormChange}
                  min="1900"
                  max={new Date().getFullYear() + 1}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.darkBg,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.cardBg}`,
                    borderRadius: theme.borderRadius.md,
                    fontSize: theme.fontSizes.base,
                  }}
                />
              </div>

              <Button
                onClick={handleAddAlbum}
                disabled={submitting}
                style={{
                  marginTop: theme.spacing.md,
                  backgroundColor: submitting ? theme.colors.textSecondary : theme.colors.primary,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Creating...' : 'Create Album'}
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};

const SongDetailModal = ({ song, playlists, onClose, onAddToPlaylist, onAddReview, token }) => {
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [reviewData, setReviewData] = useState({ content: '', score: 5 });
  const [submitting, setSubmitting] = useState(false);

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) {
      alert('Playlist name required');
      return;
    }
    setSubmitting(true);
    try {
      await onAddToPlaylist(song.id, null, playlistName.trim(), playlistDescription.trim() || null);
      setPlaylistName('');
      setPlaylistDescription('');
      setShowPlaylistForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddToExistingPlaylist = async () => {
    if (!selectedPlaylistId) {
      alert('Please select a playlist');
      return;
    }
    setSubmitting(true);
    try {
      await onAddToPlaylist(song.id, selectedPlaylistId, null);
      setSelectedPlaylistId('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewData.content.trim()) {
      alert('Review content required');
      return;
    }
    setSubmitting(true);
    try {
      await onAddReview(song.id, reviewData.content.trim(), parseInt(reviewData.score));
      setReviewData({ content: '', score: 5 });
      setShowReviewForm(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (!song) return null;

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <Card style={{ maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: theme.spacing.lg }}>
          <div>
            <h2 style={{ fontSize: theme.fontSizes['2xl'], fontWeight: 'bold', marginBottom: theme.spacing.sm }}>
              {song.title}
            </h2>
            <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.xs }}>
              By {song.artist.name}
            </p>
            <p style={{ color: theme.colors.textSecondary, marginBottom: theme.spacing.sm }}>
              {song.genre.name} • {formatDuration(song.duration)}
            </p>
            {song.explicit !== undefined && (
              <p style={{ color: theme.colors.textSecondary }}>
                {song.explicit ? '🔞 Explicit' : '✓ Clean'} • Popularity: {song.popularity ?? 'N/A'}
              </p>
            )}
          </div>
          <Button onClick={onClose} style={{ backgroundColor: theme.colors.cardBg, color: theme.colors.text }}>
            ✕
          </Button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
          {/* Add to Playlist */}
          <div>
            <h3 style={{ fontSize: theme.fontSizes.lg, fontWeight: 'bold', marginBottom: theme.spacing.sm }}>
              Add to Playlist
            </h3>
            {!showPlaylistForm ? (
              <Button onClick={() => setShowPlaylistForm(true)} style={{ width: '100%' }}>
                Manage Playlists
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {playlists.length > 0 && (
                  <>
                    <div>
                      <label style={{ display: 'block', marginBottom: theme.spacing.sm, color: theme.colors.text }}>
                        Select Existing Playlist
                      </label>
                      <select
                        value={selectedPlaylistId}
                        onChange={(e) => setSelectedPlaylistId(e.target.value)}
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          backgroundColor: theme.colors.darkBg,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.cardBg}`,
                          borderRadius: theme.borderRadius.md,
                        }}
                      >
                        <option value="">-- Select a playlist --</option>
                        {playlists.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <Button
                        onClick={handleAddToExistingPlaylist}
                        disabled={submitting}
                        style={{ width: '100%', marginTop: theme.spacing.sm }}
                      >
                        Add to Selected Playlist
                      </Button>
                    </div>
                    <p style={{ color: theme.colors.textSecondary, textAlign: 'center' }}>or</p>
                  </>
                )}
                <div>
                  <label style={{ display: 'block', marginBottom: theme.spacing.sm, color: theme.colors.text }}>
                    Create New Playlist
                  </label>
                  <input
                    type="text"
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="Playlist name"
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      backgroundColor: theme.colors.darkBg,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.cardBg}`,
                      borderRadius: theme.borderRadius.md,
                      marginBottom: theme.spacing.sm,
                    }}
                  />
                  <label style={{ display: 'block', marginBottom: theme.spacing.sm, color: theme.colors.text, marginTop: theme.spacing.sm }}>
                    Description (optional)
                  </label>
                  <textarea
                    value={playlistDescription}
                    onChange={(e) => setPlaylistDescription(e.target.value)}
                    placeholder="Add a description for your playlist..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                      backgroundColor: theme.colors.darkBg,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.cardBg}`,
                      borderRadius: theme.borderRadius.md,
                      marginBottom: theme.spacing.sm,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                  <Button
                    onClick={handleCreatePlaylist}
                    disabled={submitting}
                    style={{ width: '100%' }}
                  >
                    Create & Add
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    setShowPlaylistForm(false);
                    setPlaylistName('');
                    setPlaylistDescription('');
                    setSelectedPlaylistId('');
                  }}
                  style={{ width: '100%', backgroundColor: theme.colors.cardBg }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Add Review */}
          <div>
            <h3 style={{ fontSize: theme.fontSizes.lg, fontWeight: 'bold', marginBottom: theme.spacing.sm }}>
              Add a Review
            </h3>
            {!showReviewForm ? (
              <Button onClick={() => setShowReviewForm(true)} style={{ width: '100%' }}>
                Write Review
              </Button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                <textarea
                  value={reviewData.content}
                  onChange={(e) => setReviewData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Share your thoughts..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: theme.spacing.sm,
                    backgroundColor: theme.colors.darkBg,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.cardBg}`,
                    borderRadius: theme.borderRadius.md,
                    fontFamily: 'inherit',
                  }}
                />
                <div>
                  <label style={{ display: 'block', marginBottom: theme.spacing.sm, color: theme.colors.text }}>
                    Rating: {reviewData.score}/10
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={reviewData.score}
                    onChange={(e) => setReviewData(prev => ({ ...prev, score: e.target.value }))}
                    style={{ width: '100%' }}
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  style={{ width: '100%' }}
                >
                  Submit Review
                </Button>
                <Button
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewData({ content: '', score: 5 });
                  }}
                  style={{ width: '100%', backgroundColor: theme.colors.cardBg }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

const MyPlaylists = ({ token }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [totalPlaylistCount, setTotalPlaylistCount] = useState(0);

  useEffect(() => {
    const loadPlaylists = async () => {
      try {
        setLoading(true);
        const data = await fetchGraphQL(GET_MY_PLAYLISTS, {}, token);
        const playlistsData = data.me?.playlists || [];
        setPlaylists(playlistsData);
        setTotalPlaylistCount(playlistsData.length);
      } catch (err) {
        console.error('Error loading playlists:', err);
      } finally {
        setLoading(false);
      }
    };
    loadPlaylists();
  }, [token]);

  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleDeletePlaylist = async (playlistId, playlistName) => {
    if (!window.confirm(`Are you sure you want to delete the playlist "${playlistName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeleting(playlistId);
      await fetchGraphQL(DELETE_PLAYLIST_MUTATION, { input: { id: playlistId } }, token);
      const updatedPlaylists = playlists.filter(p => p.id !== playlistId);
      setPlaylists(updatedPlaylists);
      setTotalPlaylistCount(updatedPlaylists.length);
      setExpandedPlaylist(null);
    } catch (err) {
      console.error('Error deleting playlist:', err);
      alert('Failed to delete playlist: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleRemoveSongFromPlaylist = async (playlistId, songId, songTitle) => {
    if (!window.confirm(`Are you sure you want to remove "${songTitle}" from this playlist?`)) {
      return;
    }
    try {
      await fetchGraphQL(REMOVE_SONG_FROM_PLAYLIST_MUTATION, { input: { playlistId, songId } }, token);
      setPlaylists(playlists.map(p => 
        p.id === playlistId 
          ? { ...p, songs: p.songs.filter(s => s.id !== songId) }
          : p
      ));
    } catch (err) {
      console.error('Error removing song from playlist:', err);
      alert('Failed to remove song: ' + err.message);
    }
  };

  const startEditPlaylist = (playlist) => {
    setEditingId(playlist.id);
    setEditForm({ name: playlist.name, description: playlist.description || '' });
  };

  const handleUpdatePlaylist = async () => {
    if (!editForm.name.trim()) {
      alert('Playlist name cannot be empty');
      return;
    }
    try {
      const result = await fetchGraphQL(UPDATE_PLAYLIST_MUTATION, { 
        input: { 
          id: editingId, 
          name: editForm.name.trim(),
          description: editForm.description.trim() || null 
        } 
      }, token);
      setPlaylists(playlists.map(p => 
        p.id === editingId 
          ? result.updatePlaylist
          : p
      ));
      setEditingId(null);
      setEditForm({ name: '', description: '' });
    } catch (err) {
      console.error('Error updating playlist:', err);
      alert('Failed to update playlist: ' + err.message);
    }
  };

  const cancelEditPlaylist = () => {
    setEditingId(null);
    setEditForm({ name: '', description: '' });
  };

  return (
    <div style={{ width: '100%' }}>
      <Header title="My Playlists" subtitle={`Manage your custom playlists (${totalPlaylistCount})`} />
      <div style={{ padding: theme.spacing.lg }}>
        {loading ? (
          <p style={{ color: theme.colors.textSecondary }}>Loading playlists...</p>
        ) : playlists.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary }}>No playlists yet. Create one by adding songs!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {playlists.map(playlist => (
              <Card key={playlist.id}>
                {editingId === playlist.id ? (
                  // Edit Mode
                  <div>
                    <div style={{ marginBottom: theme.spacing.md }}>
                      <label style={{ display: 'block', marginBottom: theme.spacing.sm, color: theme.colors.text, fontWeight: 'bold' }}>
                        Playlist Name
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          backgroundColor: theme.colors.darkBg,
                          border: `1px solid ${theme.colors.primary}`,
                          borderRadius: theme.borderRadius.md,
                          color: theme.colors.text,
                          fontSize: theme.fontSizes.base,
                          marginBottom: theme.spacing.sm,
                        }}
                      />
                      <label style={{ display: 'block', marginBottom: theme.spacing.sm, color: theme.colors.text, fontWeight: 'bold' }}>
                        Description (optional)
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        style={{
                          width: '100%',
                          padding: theme.spacing.sm,
                          backgroundColor: theme.colors.darkBg,
                          border: `1px solid ${theme.colors.primary}`,
                          borderRadius: theme.borderRadius.md,
                          color: theme.colors.text,
                          fontSize: theme.fontSizes.base,
                          minHeight: '60px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                      <button
                        onClick={handleUpdatePlaylist}
                        style={{
                          flex: 1,
                          padding: theme.spacing.sm,
                          backgroundColor: theme.colors.primary,
                          color: '#000',
                          border: 'none',
                          borderRadius: theme.borderRadius.md,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = '#1abc9c';
                          e.target.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = theme.colors.primary;
                          e.target.style.transform = 'scale(1)';
                        }}
                      >
                        ✓ Save Changes
                      </button>
                      <button
                        onClick={cancelEditPlaylist}
                        style={{
                          flex: 1,
                          padding: theme.spacing.sm,
                          backgroundColor: theme.colors.cardBg,
                          color: theme.colors.text,
                          border: `1px solid ${theme.colors.cardBg}`,
                          borderRadius: theme.borderRadius.md,
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = theme.colors.sidebarBg;
                          e.target.style.borderColor = theme.colors.text;
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = theme.colors.cardBg;
                          e.target.style.borderColor = theme.colors.cardBg;
                        }}
                      >
                        ✕ Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md }}>
                      <button
                        onClick={() => setExpandedPlaylist(expandedPlaylist === playlist.id ? null : playlist.id)}
                        style={{
                          flex: 1,
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                      >
                        <h3 style={{ fontSize: theme.fontSizes.lg, fontWeight: 'bold', marginBottom: theme.spacing.sm, display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                          <span style={{ width: 20, height: 20, color: theme.colors.primary }}>{icons.playlists}</span>
                          {playlist.name}
                        </h3>
                        {playlist.description && (
                          <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, marginBottom: theme.spacing.sm }}>
                            {playlist.description}
                          </p>
                        )}
                        <p style={{ color: theme.colors.primary, fontSize: theme.fontSizes.sm }}>
                          {playlist.songs.length} song{playlist.songs.length !== 1 ? 's' : ''} • Click to expand
                        </p>
                      </button>
                      <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                        <button
                          onClick={() => startEditPlaylist(playlist)}
                          style={{
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            backgroundColor: theme.colors.primary,
                            color: '#000',
                            border: 'none',
                            borderRadius: theme.borderRadius.md,
                            cursor: 'pointer',
                            fontSize: theme.fontSizes.sm,
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#1abc9c';
                            e.target.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = theme.colors.primary;
                            e.target.style.transform = 'scale(1)';
                          }}
                        >
                          <span style={{ width: 14, height: 14, display: 'flex', alignItems: 'center', marginRight: '4px' }}>{icons.edit}</span>
                        </button>
                        <button
                          onClick={() => handleDeletePlaylist(playlist.id, playlist.name)}
                          disabled={deleting === playlist.id}
                          style={{
                            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                            backgroundColor: '#e05555',
                            color: '#fff',
                            border: 'none',
                            borderRadius: theme.borderRadius.md,
                            cursor: deleting === playlist.id ? 'not-allowed' : 'pointer',
                            fontSize: theme.fontSizes.sm,
                            fontWeight: 'bold',
                            opacity: deleting === playlist.id ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) => {
                            if (deleting !== playlist.id) {
                              e.target.style.backgroundColor = '#d04545';
                              e.target.style.transform = 'scale(1.05)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (deleting !== playlist.id) {
                              e.target.style.backgroundColor = '#e05555';
                              e.target.style.transform = 'scale(1)';
                            }
                          }}
                        >
                          {deleting === playlist.id ? '...' : <><span style={{ width: 14, height: 14, display: 'inline-flex', alignItems: 'center', marginRight: '4px' }}>{icons.trash}</span></>}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {expandedPlaylist === playlist.id && (
                  <div style={{ marginTop: theme.spacing.md, paddingTop: theme.spacing.md, borderTop: `1px solid ${theme.colors.cardBg}` }}>
                    {playlist.songs.length === 0 ? (
                      <p style={{ color: theme.colors.textSecondary }}>No songs in this playlist</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                        {playlist.songs.map(song => (
                          <div key={song.id} style={{
                            padding: theme.spacing.sm,
                            backgroundColor: theme.colors.darkBg,
                            borderRadius: theme.borderRadius.md,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: theme.spacing.sm,
                          }}>
                            <div style={{ flex: 1 }}>
                              <p style={{ fontWeight: 'bold' }}>{song.title}</p>
                              <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm }}>
                                {song.artist.name} • {formatDuration(song.duration)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveSongFromPlaylist(playlist.id, song.id, song.title)}
                              style={{
                                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                                backgroundColor: '#e05555',
                                color: '#fff',
                                border: 'none',
                                borderRadius: theme.borderRadius.md,
                                cursor: 'pointer',
                                fontSize: theme.fontSizes.sm,
                                fontWeight: 'bold',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#d04545';
                                e.target.style.transform = 'scale(1.05)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#e05555';
                                e.target.style.transform = 'scale(1)';
                              }}
                            >
                              ✕ Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MyReviews = ({ token }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [totalReviewCount, setTotalReviewCount] = useState(0);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        setLoading(true);
        const data = await fetchGraphQL(GET_MY_REVIEWS, {}, token);
        const reviewsData = data.me?.reviews || [];
        setReviews(reviewsData);
        setTotalReviewCount(reviewsData.length);
      } catch (err) {
        console.error('Error loading reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, [token]);

  const handleDeleteReview = async (reviewId, songTitle) => {
    if (!window.confirm(`Are you sure you want to delete your review for "${songTitle}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeleting(reviewId);
      await fetchGraphQL(DELETE_REVIEW_MUTATION, { input: { id: reviewId } }, token);
      const updatedReviews = reviews.filter(r => r.id !== reviewId);
      setReviews(updatedReviews);
      setTotalReviewCount(updatedReviews.length);
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <Header title="My Reviews" subtitle={`See all your song reviews (${totalReviewCount})`} />
      <div style={{ padding: theme.spacing.lg }}>
        {loading ? (
          <p style={{ color: theme.colors.textSecondary }}>Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p style={{ color: theme.colors.textSecondary }}>No reviews yet. Share your thoughts on songs!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
            {reviews.map(review => (
              <Card key={review.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.md, marginBottom: theme.spacing.sm }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: theme.fontSizes.lg, fontWeight: 'bold', marginBottom: theme.spacing.xs }}>
                      {review.song.title}
                    </h3>
                    <p style={{ color: theme.colors.textSecondary, fontSize: theme.fontSizes.sm, marginBottom: theme.spacing.sm }}>
                      By {review.song.artist.name}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.sm,
                      marginBottom: theme.spacing.sm,
                    }}>
                      <span style={{ fontSize: theme.fontSizes.xl, fontWeight: 'bold', color: theme.colors.primary }}>
                        {review.score}/10
                      </span>
                      <span style={{ color: theme.colors.textSecondary }}>
                        <span style={{ color: theme.colors.primary, letterSpacing: '2px' }}>{'★'.repeat(Math.round(review.score / 2))}</span>
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(review.id, review.song.title)}
                    disabled={deleting === review.id}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      backgroundColor: '#e05555',
                      color: '#fff',
                      border: 'none',
                      borderRadius: theme.borderRadius.md,
                      cursor: deleting === review.id ? 'not-allowed' : 'pointer',
                      fontSize: theme.fontSizes.sm,
                      fontWeight: 'bold',
                      opacity: deleting === review.id ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      if (deleting !== review.id) {
                        e.target.style.backgroundColor = '#d04545';
                        e.target.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (deleting !== review.id) {
                        e.target.style.backgroundColor = '#e05555';
                        e.target.style.transform = 'scale(1)';
                      }
                    }}
                  >
                    {deleting === review.id ? '...' : <><span style={{ width: 14, height: 14, display: 'inline-flex', alignItems: 'center', marginRight: '4px' }}>{icons.trash}</span>Delete</>}
                  </button>
                </div>
                <p style={{ color: theme.colors.text, lineHeight: '1.6' }}>
                  {review.content}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const MainApp = () => {
  const [activePage, setActivePage] = React.useState('dashboard');
  const [selectedSong, setSelectedSong] = React.useState(null);
  const [myPlaylists, setMyPlaylists] = React.useState([]);
  const { isAuthenticated, token, role, email, login, logout } = useAuth();

  const loadMyPlaylists = async () => {
    try {
      const data = await fetchGraphQL(GET_MY_PLAYLISTS, {}, token);
      setMyPlaylists(data.me?.playlists || []);
    } catch (err) {
      console.error('Error loading playlists:', err);
    }
  };

  React.useEffect(() => {
    if (role === 'LISTENER') {
      loadMyPlaylists();
    }
  }, [role, token]);

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  const handleAddToPlaylist = async (songId, playlistId, newPlaylistName, newPlaylistDescription) => {
    try {
      if (newPlaylistName) {
        // Create new playlist
        const createResult = await fetchGraphQL(ADD_PLAYLIST_MUTATION, {
          input: { name: newPlaylistName, description: newPlaylistDescription }
        }, token);
        const newPlaylist = createResult.addPlaylist;
        
        // Add song to new playlist
        await fetchGraphQL(ADD_SONG_TO_PLAYLIST_MUTATION, {
          input: { playlistId: newPlaylist.id, songId }
        }, token);
      } else if (playlistId) {
        // Add to existing playlist
        await fetchGraphQL(ADD_SONG_TO_PLAYLIST_MUTATION, {
          input: { playlistId, songId }
        }, token);
      }
      
      alert('Song added to playlist!');
      await loadMyPlaylists();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddReview = async (songId, content, score) => {
    try {
      await fetchGraphQL(ADD_REVIEW_MUTATION, {
        input: { songId, content, score }
      }, token);
      alert('Review added successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard token={token} />;
      case 'songs':
        return role === 'LISTENER' ? (
          <Songs token={token} role={role} onSongClick={setSelectedSong} />
        ) : (
          <Songs token={token} role={role} />
        );
      case 'artists':
        return <Artists token={token} />;
      case 'genres':
        return <Genres token={token} />;
      case 'my-songs':
        return <MySongs token={token} />;
      case 'my-albums':
        return <MyAlbums token={token} />;
      case 'playlists':
        return <MyPlaylists token={token} />;
      case 'reviews':
        return <MyReviews token={token} />;
      default:
        return <Dashboard token={token} />;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', backgroundColor: theme.colors.darkBg }}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={logout} role={role} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <div style={{ flex: 1, overflowY: 'auto', width: '100%' }}>
          {renderPage()}
        </div>
      </div>
      {selectedSong && (
        <SongDetailModal
          song={selectedSong}
          playlists={myPlaylists}
          onClose={() => setSelectedSong(null)}
          onAddToPlaylist={handleAddToPlaylist}
          onAddReview={handleAddReview}
          token={token}
        />
      )}
    </div>
  );
};
