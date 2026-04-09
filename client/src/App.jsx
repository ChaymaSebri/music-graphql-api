import React from 'react';
import { theme } from './styles/theme.js';
import { useAuth } from './context/AuthContext.jsx';
import { Login } from './components/Login.jsx';
import { Sidebar } from './components/Sidebar.jsx';

import { Dashboard, Songs, Artists, Genres } from './pages/CatalogPages.jsx';
import { SongDetailModal, MyPlaylists, MyReviews } from './pages/CommunityPages.jsx';
import { MySongs, MyAlbums } from './pages/ArtistPages.jsx';

import {
  fetchGraphQL,
  GET_MY_PLAYLISTS,
  GET_ARTIST_FOLLOWER_COUNT_QUERY,
  MY_FOLLOWED_ARTISTS_QUERY,
  ADD_PLAYLIST_MUTATION,
  ADD_SONG_TO_PLAYLIST_MUTATION,
  ADD_REVIEW_MUTATION,
} from './graphql/api.js';
import { subscribeGraphQL, resetSubscriptionClient } from './realtime/subscriptions.js';

const ACTIVE_PAGE_STORAGE_KEY = 'appActivePage';
const NOTIFICATION_HISTORY_STORAGE_KEY = 'appNotificationHistory';

function readNotificationHistory() {
  try {
    const raw = localStorage.getItem(NOTIFICATION_HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((item) => {
      if (!item || !item.id || !item.title || !item.message || !item.createdAt) return false;

      // Drop legacy review success toasts from persisted history.
      if (item.title === 'Review added' && item.message === 'Your review was posted successfully') {
        return false;
      }

      return true;
    });
  } catch {
    return [];
  }
}

function readActivePage() {
  return localStorage.getItem(ACTIVE_PAGE_STORAGE_KEY) || 'dashboard';
}

const styleTag = document.createElement('style');
styleTag.textContent = `
  @keyframes fadeUp { from { opacity: 0; transform: translateY(12px);} to { opacity: 1; transform: translateY(0);} }
  @keyframes cardHover { 0% { transform: translateY(0);} 100% { transform: translateY(-2px);} }

  .page-card {
    animation: fadeUp 0.4s ease both;
    transition: all 0.3s ease;
    border: 1px solid #1a1a1a;
    background: linear-gradient(135deg, #1a1a1a 0%, #161616 100%);
  }

  .page-card:hover {
    border-color: rgba(29,185,84,0.2);
    box-shadow: 0 4px 12px rgba(29,185,84,0.08);
    animation: cardHover 0.3s ease forwards;
  }

  .icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    background: rgba(29,185,84,0.08);
    border: 1px solid rgba(29,185,84,0.1);
    border-radius: 6px;
    color: #1DB954;
    cursor: pointer;
    transition: all 0.2s ease;
  }
`;
if (!document.head.querySelector('[data-app-styles]')) {
  styleTag.setAttribute('data-app-styles', '');
  document.head.appendChild(styleTag);
}

export const MainApp = () => {
  const NOTIFICATION_DURATION_MS = 6000;
  const NOTIFICATION_HISTORY_LIMIT = 40;

  const [activePage, setActivePage] = React.useState(readActivePage);
  const [selectedSong, setSelectedSong] = React.useState(null);
  const [myPlaylists, setMyPlaylists] = React.useState([]);
  const [followedArtists, setFollowedArtists] = React.useState([]);
  const [notifications, setNotifications] = React.useState([]);
  const [notificationHistory, setNotificationHistory] = React.useState(readNotificationHistory);
  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false);
  const [artistFollowerCount, setArtistFollowerCount] = React.useState(0);
  const [followRefresh, setFollowRefresh] = React.useState(0);

  const { isAuthenticated, token, role, sub, email, login, logout } = useAuth();

  const handleLoginSuccess = (jwtToken, userRole, userEmail) => {
    login(jwtToken, userRole, userEmail);
    setActivePage('dashboard');
    setSelectedSong(null);
  };

  const handleLogout = () => {
    logout();
    setActivePage('dashboard');
    setSelectedSong(null);
    setFollowedArtists([]);
    setNotifications([]);
    setNotificationHistory([]);
    setIsHistoryOpen(false);
    setArtistFollowerCount(0);
    resetSubscriptionClient();
  };

  const dismissNotification = React.useCallback((id) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushNotification = (title, message) => {
    const now = new Date();
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setNotifications((prev) => [{ id, title, message }, ...prev].slice(0, 5));
    setNotificationHistory((prev) => ([
      { id, title, message, createdAt: now.toISOString() },
      ...prev,
    ]).slice(0, NOTIFICATION_HISTORY_LIMIT));
    window.setTimeout(() => {
      dismissNotification(id);
    }, NOTIFICATION_DURATION_MS);
  };

  const loadFollowedArtists = React.useCallback(async () => {
    if (role !== 'LISTENER' || !token) {
      setFollowedArtists([]);
      return [];
    }

    try {
      const data = await fetchGraphQL(MY_FOLLOWED_ARTISTS_QUERY, {}, token);
      const artists = data.myFollowedArtists || [];
      setFollowedArtists(artists);
      return artists;
    } catch (err) {
      console.error('Error loading followed artists:', err);
      setFollowedArtists([]);
      return [];
    }
  }, [role, token]);

  const loadMyPlaylists = async () => {
    try {
      const data = await fetchGraphQL(GET_MY_PLAYLISTS, {}, token);
      setMyPlaylists(data.me?.playlists || []);
    } catch (err) {
      console.error('Error loading playlists:', err);
    }
  };

  React.useEffect(() => {
    if (role === 'LISTENER') loadMyPlaylists();
  }, [role, token]);

  React.useEffect(() => {
    const loadArtistFollowers = async () => {
      if (role !== 'ARTIST' || !token || !email) {
        setArtistFollowerCount(0);
        return;
      }

      try {
        const data = await fetchGraphQL(GET_ARTIST_FOLLOWER_COUNT_QUERY, { artistEmail: email }, token);
        setArtistFollowerCount(data.artists?.[0]?.followersCount || 0);
      } catch (err) {
        console.error('Error loading artist followers count:', err);
        setArtistFollowerCount(0);
      }
    };

    loadArtistFollowers();
  }, [role, token, email, followRefresh]);

  React.useEffect(() => {
    localStorage.setItem(ACTIVE_PAGE_STORAGE_KEY, activePage);
  }, [activePage]);

  React.useEffect(() => {
    localStorage.setItem(NOTIFICATION_HISTORY_STORAGE_KEY, JSON.stringify(notificationHistory));
  }, [notificationHistory]);

  React.useEffect(() => {
    let active = true;

    const startSubscriptions = async () => {
      if (!isAuthenticated || !token) return;

      const subscribeArtistNotifications = async () => {
        const artists = await loadFollowedArtists();
        if (!active) return;

        resetSubscriptionClient();

        if (role === 'LISTENER') {
          artists.forEach((artist) => {
            subscribeGraphQL({
              token,
              query: `subscription ArtistSongAdded($artistId: ID!) { artistSongAdded(artistId: $artistId) { id title artist { id name } } }`,
              variables: { artistId: artist.id },
              next: ({ data }) => {
                const song = data?.artistSongAdded;
                if (song) {
                  const artist = song.artist || artists.find((item) => String(item.id) === String(song.artist?.id));
                  pushNotification('New song', `${artist?.name || 'An artist'} released ${song.title}`);
                }
              },
              error: console.error,
            });

            subscribeGraphQL({
              token,
              query: `subscription ArtistAlbumAdded($artistId: ID!) { artistAlbumAdded(artistId: $artistId) { id title releaseYear artist { id name } } }`,
              variables: { artistId: artist.id },
              next: ({ data }) => {
                const album = data?.artistAlbumAdded;
                if (album) {
                  const artist = album.artist || artists.find((item) => String(item.id) === String(album.artist?.id));
                  pushNotification('New album', `${artist?.name || 'An artist'} released ${album.title}`);
                }
              },
              error: console.error,
            });
          });
        }

        if (role === 'ARTIST' && sub) {
          subscribeGraphQL({
            token,
            query: `subscription ReviewAddedForArtist($artistId: ID!) { reviewAddedForArtist(artistId: $artistId) { id score content song { title } listener { email } } }`,
            variables: { artistId: sub },
            next: ({ data }) => {
              const review = data?.reviewAddedForArtist;
              if (review) {
                pushNotification('New review', `A review was added for ${review.song.title}`);
              }
            },
            error: console.error,
          });
        }
      };

      await subscribeArtistNotifications();
    };

    startSubscriptions();

    return () => {
      active = false;
      resetSubscriptionClient();
    };
  }, [isAuthenticated, role, token, sub, followRefresh, loadFollowedArtists]);

  React.useEffect(() => () => {
    setNotifications([]);
  }, []);

  if (!isAuthenticated) return <Login onLogin={handleLoginSuccess} />;

  const handleAddToPlaylist = async (songId, playlistId, newPlaylistName, newPlaylistDescription) => {
    try {
      if (newPlaylistName) {
        const createResult = await fetchGraphQL(
          ADD_PLAYLIST_MUTATION,
          { input: { name: newPlaylistName, description: newPlaylistDescription } },
          token
        );
        await fetchGraphQL(
          ADD_SONG_TO_PLAYLIST_MUTATION,
          { input: { playlistId: createResult.addPlaylist.id, songId } },
          token
        );
      } else if (playlistId) {
        await fetchGraphQL(
          ADD_SONG_TO_PLAYLIST_MUTATION,
          { input: { playlistId, songId } },
          token
        );
      }

      pushNotification('Playlist updated', 'Song added to playlist');
      await loadMyPlaylists();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddReview = async (songId, content, score) => {
    try {
      await fetchGraphQL(ADD_REVIEW_MUTATION, { input: { songId, content, score } }, token);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard token={token} />;
      case 'songs': return <Songs token={token} role={role} onSongClick={role === 'LISTENER' ? setSelectedSong : undefined} />;
      case 'artists': return <Artists token={token} role={role} onFollowChanged={() => setFollowRefresh((value) => value + 1)} />;
      case 'genres': return <Genres token={token} />;
      case 'my-songs': return <MySongs token={token} />;
      case 'my-albums': return <MyAlbums token={token} />;
      case 'playlists': return <MyPlaylists token={token} />;
      case 'reviews': return <MyReviews token={token} />;
      default: return <Dashboard token={token} />;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', backgroundColor: theme.colors.darkBg }}>
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        onLogout={handleLogout}
        role={role}
        artistFollowerCount={artistFollowerCount}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        <div style={{ flex: 1, overflowY: 'auto', width: '100%' }}>{renderPage()}</div>
      </div>

      <div style={{ position: 'fixed', right: 18, top: 18, zIndex: 2000, display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
        {notifications.map((notification) => (
          <div key={notification.id} style={{ background: '#121212', border: '1px solid #1DB95433', borderRadius: 10, padding: '12px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: '#1DB954', marginBottom: 4 }}>{notification.title}</div>
              <button
                type="button"
                onClick={() => dismissNotification(notification.id)}
                aria-label="Dismiss notification"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#9aa0a6',
                  cursor: 'pointer',
                  fontSize: 14,
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                x
              </button>
            </div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#ddd', lineHeight: 1.5 }}>{notification.message}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 2000, width: 340 }}>
        <button
          type="button"
          onClick={() => setIsHistoryOpen((value) => !value)}
          style={{
            width: '100%',
            border: '1px solid #1DB95444',
            borderRadius: 10,
            background: '#111',
            color: '#ddd',
            padding: '10px 12px',
            textAlign: 'left',
            cursor: 'pointer',
            fontFamily: "'DM Mono', monospace",
            fontSize: 12,
          }}
        >
          Notification history ({notificationHistory.length})
        </button>

        {isHistoryOpen && (
          <div style={{ marginTop: 8, background: '#101010', border: '1px solid #1DB95433', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #1DB95422' }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", color: '#1DB954', fontSize: 15 }}>Recent notifications</div>
              <button
                type="button"
                onClick={() => setNotificationHistory([])}
                style={{ border: 'none', background: 'transparent', color: '#9aa0a6', cursor: 'pointer', fontSize: 12 }}
              >
                Clear
              </button>
            </div>

            <div style={{ maxHeight: 260, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {notificationHistory.length === 0 && (
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#9aa0a6' }}>
                  No notifications yet.
                </div>
              )}

              {notificationHistory.map((item) => (
                <div key={`history-${item.id}`} style={{ border: '1px solid #ffffff14', borderRadius: 8, padding: '8px 10px', background: '#151515' }}>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 14, color: '#1DB954' }}>{item.title}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#ddd', lineHeight: 1.45, marginTop: 2 }}>{item.message}</div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#8f8f8f', marginTop: 4 }}>
                    {new Date(item.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedSong && (
        <SongDetailModal
          song={selectedSong}
          playlists={myPlaylists}
          onClose={() => setSelectedSong(null)}
          onAddToPlaylist={handleAddToPlaylist}
          onAddReview={handleAddReview}
        />
      )}
    </div>
  );
};