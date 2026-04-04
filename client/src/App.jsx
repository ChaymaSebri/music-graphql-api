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
  ADD_PLAYLIST_MUTATION,
  ADD_SONG_TO_PLAYLIST_MUTATION,
  ADD_REVIEW_MUTATION,
} from './graphql/api.js';

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
  const [activePage, setActivePage] = React.useState('dashboard');
  const [selectedSong, setSelectedSong] = React.useState(null);
  const [myPlaylists, setMyPlaylists] = React.useState([]);

  const { isAuthenticated, token, role, login, logout } = useAuth();

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

  if (!isAuthenticated) return <Login onLogin={login} />;

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

      alert('Song added to playlist!');
      await loadMyPlaylists();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleAddReview = async (songId, content, score) => {
    try {
      await fetchGraphQL(ADD_REVIEW_MUTATION, { input: { songId, content, score } }, token);
      alert('Review added successfully!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard token={token} />;
      case 'songs': return <Songs token={token} role={role} onSongClick={role === 'LISTENER' ? setSelectedSong : undefined} />;
      case 'artists': return <Artists token={token} />;
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
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={logout} role={role} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', width: '100%' }}>
        <div style={{ flex: 1, overflowY: 'auto', width: '100%' }}>{renderPage()}</div>
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