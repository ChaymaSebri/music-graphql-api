import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchGraphQL,
  GENRES_QUERY,
  ADD_SONG_MUTATION,
  ADD_ALBUM_MUTATION,
  MY_SONGS_QUERY,
  GET_TOTAL_SONGS_QUERY,
  GET_ARTIST_ALBUMS_QUERY,
  GET_MY_ALBUMS_QUERY,
  GET_TOTAL_ALBUMS_QUERY,
} from '../graphql/api.js';

// ─── Inject styles once ──────────────────────────────────────────────────────
const styleTag = document.createElement('style');
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .ap-fadeup { animation: fadeUp 0.4s ease both; }

  /* ── Form inputs ── */
  .ap-input {
    width: 100%;
    padding: 11px 14px;
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    color: #e8e8e8;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    box-sizing: border-box;
    transition: border-color 0.2s, box-shadow 0.2s;
    appearance: none;
  }
  .ap-input:focus {
    outline: none;
    border-color: #1DB954;
    box-shadow: 0 0 0 3px rgba(29,185,84,0.12);
  }
  .ap-input::placeholder { color: #3a3a3a; }
  .ap-input option { background: #1a1a1a; color: #e8e8e8; }

  /* ── Checkbox ── */
  .ap-checkbox {
    width: 16px; height: 16px;
    accent-color: #1DB954;
    cursor: pointer;
    flex-shrink: 0;
  }

  /* ── Buttons ── */
  .btn-green {
    padding: 11px 20px;
    background: #1DB954;
    border: none;
    border-radius: 8px;
    color: #000;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-green:hover:not(:disabled) { background: #22d461; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(29,185,84,0.3); }
  .btn-green:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .btn-ghost {
    padding: 11px 20px;
    background: transparent;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    color: #666;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-ghost:hover { border-color: #444; color: #aaa; }

  .pg-btn {
    padding: 8px 20px;
    background: transparent;
    border: 1px solid #2a2a2a;
    border-radius: 20px;
    color: #aaa;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
  }
  .pg-btn:hover:not(:disabled) { border-color: #1DB954; color: #1DB954; }
  .pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* ── Song / album rows ── */
  .song-row {
    background: #121212;
    border: 1px solid #1e1e1e;
    border-radius: 10px;
    padding: 14px 18px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    transition: border-color 0.2s, background 0.2s;
  }
  .song-row:hover { background: #161616; border-color: #2a2a2a; }

  .album-card {
    background: #121212;
    border: 1px solid #1e1e1e;
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s, transform 0.2s;
  }
  .album-card:hover { border-color: rgba(29,185,84,0.25); transform: translateY(-2px); }
  .album-card.open { border-color: rgba(29,185,84,0.3); transform: none; }

  .album-song-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 9px 14px;
    border-radius: 6px;
    background: #0e0e0e;
    transition: background 0.15s;
    gap: 12px;
  }
  .album-song-row:hover { background: #141414; }

  /* ── Error banner ── */
  .error-banner {
    padding: 12px 16px;
    background: rgba(224,85,85,0.08);
    border: 1px solid rgba(224,85,85,0.2);
    border-radius: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    color: #e05555;
    margin-bottom: 20px;
  }
`;
if (!document.head.querySelector('[data-artist-styles]')) {
  styleTag.setAttribute('data-artist-styles', '');
  document.head.appendChild(styleTag);
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const PageHeader = ({ title, subtitle, action }) => (
  <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
    <div>
      <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', fontWeight: 400, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>{title}</h2>
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#404040', margin: 0 }}>{subtitle}</p>
    </div>
    {action}
  </div>
);

const LoadingState = ({ label }) => (
  <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
    <div style={{ height: 2, width: 100, background: 'linear-gradient(90deg,#1a1a1a,#1DB954,#1a1a1a)', backgroundSize: '200% 100%', borderRadius: 2, animation: 'shimmer 1.4s ease infinite' }}/>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
  </div>
);

const Empty = ({ message }) => (
  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#333', letterSpacing: '0.08em', padding: '40px 0' }}>{message}</p>
);

export const SectionLabel = ({ children }) => (
  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#333', margin: '0 0 8px' }}>{children}</p>
);

const fmt = (ms) => {
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(0);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const avgScore = (reviews) => {
  if (!reviews?.length) return null;
  return (reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length).toFixed(1);
};

const scoreColor = (n) => n >= 8 ? '#1DB954' : n >= 5 ? '#facc15' : '#e05555';

// ─── MySongs ──────────────────────────────────────────────────────────────────

export const MySongs = ({ token }) => {
  const { email } = useAuth();
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [genres, setGenres] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ title: '', duration: '', genreId: '', albumId: '', explicit: false });
  const [artistId, setArtistId] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [totalSongCount, setTotalSongCount] = useState(0);
  const PER_PAGE = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setError(null);
        const data = await fetchGraphQL(MY_SONGS_QUERY, { artistEmail: email, skip, take: PER_PAGE + 1 }, token);
        const artist = data.artists?.[0];
        if (artist) {
          setArtistId(artist.id);
          const all = artist.songs || [];
          setHasMore(all.length > PER_PAGE);
          setSongs(all.slice(0, PER_PAGE));
          const cd = await fetchGraphQL(GET_TOTAL_SONGS_QUERY, { artistEmail: email }, token);
          setTotalSongCount(cd.artists?.[0]?.songs?.length || 0);
        } else {
          setSongs([]); setHasMore(false); setTotalSongCount(0);
          setError('No artist profile found.');
        }
      } catch (err) { setError(err.message); setSongs([]); setHasMore(false); }
      finally { setLoading(false); }
    };
    load();
  }, [skip, token, email, refresh]);

  useEffect(() => {
    if (!showAddForm) return;
    Promise.all([
      fetchGraphQL(GENRES_QUERY, { skip: 0, take: 100 }, token),
      fetchGraphQL(GET_ARTIST_ALBUMS_QUERY, { artistEmail: email }, token),
    ]).then(([gd, ad]) => {
      setGenres(gd.genres || []);
      setAlbums(ad.artists?.[0]?.albums || []);
    }).catch(console.error);
  }, [showAddForm, token, email]);

  const handleAddSong = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.duration || !formData.genreId) return alert('Title, duration, and genre are required');
    if (!artistId) return alert('Unable to determine your artist ID.');
    setSubmitting(true);
    try {
      const input = { title: formData.title.trim(), duration: parseInt(formData.duration, 10), genreId: formData.genreId, artistId, explicit: formData.explicit };
      if (formData.albumId) input.albumId = formData.albumId;
      const result = await fetchGraphQL(ADD_SONG_MUTATION, { input }, token);
      if (result.addSong) {
        setFormData({ title: '', duration: '', genreId: '', albumId: '', explicit: false });
        setShowAddForm(false); setSkip(0); setRefresh(v => v + 1);
      }
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setSubmitting(false); }
  };

  if (showAddForm) return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Add New Song"
        subtitle="Upload a track to your catalogue"
        action={<button className="btn-ghost" onClick={() => setShowAddForm(false)}>← Back</button>}
      />
      <div style={{ padding: '28px 32px', maxWidth: 520 }}>
        <form onSubmit={handleAddSong} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          <div><SectionLabel>Song Title</SectionLabel>
            <input className="ap-input" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Midnight Drive"/>
          </div>

          <div><SectionLabel>Duration (milliseconds)</SectionLabel>
            <input className="ap-input" type="number" min="1" value={formData.duration} onChange={e => setFormData(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 210000"/>
          </div>

          <div><SectionLabel>Genre</SectionLabel>
            <select className="ap-input" value={formData.genreId} onChange={e => setFormData(p => ({ ...p, genreId: e.target.value }))}>
              <option value="">Select a genre…</option>
              {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div><SectionLabel>Album (optional)</SectionLabel>
            <select className="ap-input" value={formData.albumId} onChange={e => setFormData(p => ({ ...p, albumId: e.target.value }))}>
              <option value="">No album</option>
              {albums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" className="ap-checkbox" checked={formData.explicit} onChange={e => setFormData(p => ({ ...p, explicit: e.target.checked }))}/>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#666', letterSpacing: '0.06em' }}>Mark as explicit</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', padding: '2px 7px', borderRadius: 4, background: 'rgba(224,85,85,0.1)', color: '#e05555', border: '1px solid rgba(224,85,85,0.2)' }}>E</span>
          </label>

          <button type="submit" className="btn-green" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? 'Uploading…' : '↑ Upload Song'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="My Songs"
        subtitle={`${totalSongCount} track${totalSongCount !== 1 ? 's' : ''} in your catalogue`}
        action={<button className="btn-green" onClick={() => setShowAddForm(true)}>+ Add Song</button>}
      />
      <div style={{ padding: '28px 32px' }}>
        {error && <div className="error-banner">Error: {error}</div>}

        {loading ? <LoadingState label="Loading your songs" /> :
         songs.length === 0 ? <Empty message="No songs yet — hit 'Add Song' to upload your first track." /> : (
          <>
            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '0 18px 10px', borderBottom: '1px solid #1a1a1a', marginBottom: 8 }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#2e2e2e' }}>Track</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#2e2e2e' }}>Stats</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {songs.map((song, i) => {
                const avg = avgScore(song.reviews);
                const color = avg ? scoreColor(parseFloat(avg)) : '#333';
                return (
                  <div key={song.id} className="song-row ap-fadeup" style={{ animationDelay: `${i * 0.04}s` }}>
                    {/* Left */}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#e8e8e8', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#1DB954' }}>{song.genre.name}</span>
                        {song.explicit && (
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', padding: '1px 6px', borderRadius: 3, background: 'rgba(224,85,85,0.1)', color: '#e05555', border: '1px solid rgba(224,85,85,0.2)' }}>E</span>
                        )}
                      </div>
                    </div>

                    {/* Right */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                      {/* Popularity bar */}
                      {song.popularity != null && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                          <div style={{ width: 50, height: 3, background: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${song.popularity}%`, height: '100%', background: '#1DB954', borderRadius: 2 }}/>
                          </div>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: '#333' }}>pop {song.popularity}</span>
                        </div>
                      )}

                      {/* Avg score */}
                      {avg && (
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '18px', color }}>{avg}</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: '#333' }}>/10</span>
                        </div>
                      )}

                      {/* Duration */}
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: '#555', minWidth: 36, textAlign: 'right' }}>{fmt(song.duration)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {(skip > 0 || hasMore) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 32, justifyContent: 'center' }}>
                <button className="pg-btn" onClick={() => setSkip(Math.max(0, skip - PER_PAGE))} disabled={skip === 0}>← Prev</button>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#444', letterSpacing: '0.1em' }}>pg {Math.floor(skip / PER_PAGE) + 1}</span>
                <button className="pg-btn" onClick={() => setSkip(skip + PER_PAGE)} disabled={!hasMore}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── MyAlbums ─────────────────────────────────────────────────────────────────

export const MyAlbums = ({ token }) => {
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

  const loadMyAlbums = async () => {
    const ad = await fetchGraphQL(GET_MY_ALBUMS_QUERY, { artistEmail: email }, token);
    const artist = ad.artists?.[0];
    if (artist) {
      setArtistId(artist.id);
      setAlbums(artist.albums || []);
      const cd = await fetchGraphQL(GET_TOTAL_ALBUMS_QUERY, { artistEmail: email }, token);
      setTotalAlbumCount(cd.artists?.[0]?.albums?.length || 0);
    } else { setAlbums([]); setTotalAlbumCount(0); }
  };

  useEffect(() => {
    (async () => {
      try { setLoading(true); setError(null); await loadMyAlbums(); }
      catch (err) { setError(err.message); setAlbums([]); }
      finally { setLoading(false); }
    })();
  }, [token, email]);

  const handleAddAlbum = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert('Album title is required');
    if (formData.releaseYear < 1900 || formData.releaseYear > new Date().getFullYear() + 1) return alert('Invalid release year');
    if (!artistId) return alert('Unable to determine your artist ID.');
    setSubmitting(true);
    try {
      const result = await fetchGraphQL(ADD_ALBUM_MUTATION, { input: { title: formData.title.trim(), releaseYear: formData.releaseYear, artistId } }, token);
      if (result.addAlbum) {
        setFormData({ title: '', releaseYear: new Date().getFullYear() });
        setShowAddForm(false); await loadMyAlbums();
      }
    } catch (err) { alert(`Error: ${err.message}`); }
    finally { setSubmitting(false); }
  };

  if (showAddForm) return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Create New Album"
        subtitle="Add an album to your discography"
        action={<button className="btn-ghost" onClick={() => setShowAddForm(false)}>← Back</button>}
      />
      <div style={{ padding: '28px 32px', maxWidth: 480 }}>
        <form onSubmit={handleAddAlbum} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><SectionLabel>Album Title</SectionLabel>
            <input className="ap-input" type="text" value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Into the Echo"/>
          </div>
          <div><SectionLabel>Release Year</SectionLabel>
            <input className="ap-input" type="number" min="1900" max={new Date().getFullYear() + 1} value={formData.releaseYear} onChange={e => setFormData(p => ({ ...p, releaseYear: parseInt(e.target.value, 10) || new Date().getFullYear() }))}/>
          </div>
          <button type="submit" className="btn-green" disabled={submitting} style={{ marginTop: 8 }}>
            {submitting ? 'Creating…' : '+ Create Album'}
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="My Albums"
        subtitle={`${totalAlbumCount} album${totalAlbumCount !== 1 ? 's' : ''} in your discography`}
        action={<button className="btn-green" onClick={() => setShowAddForm(true)}>+ Create Album</button>}
      />
      <div style={{ padding: '28px 32px' }}>
        {error && <div className="error-banner">Error: {error}</div>}
        {loading ? <LoadingState label="Loading your albums" /> :
         albums.length === 0 ? <Empty message="No albums yet — create your first album above." /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {albums.map((album, i) => {
              const isOpen = selectedAlbumId === album.id;
              return (
                <div key={album.id} className="ap-fadeup" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className={`album-card ${isOpen ? 'open' : ''}`} onClick={() => setSelectedAlbumId(isOpen ? null : album.id)}>
                    {/* Album art placeholder */}
                    <div style={{
                      height: 140,
                      background: `linear-gradient(135deg, #1a1a1a 0%, #0e0e0e 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative', overflow: 'hidden',
                    }}>
                      {/* Vinyl rings decoration */}
                      <svg width="90" height="90" viewBox="0 0 90 90" style={{ opacity: isOpen ? 0.2 : 0.08, transition: 'opacity 0.3s' }}>
                        {[8, 18, 28, 38, 44].map((r, j) => (
                          <circle key={j} cx="45" cy="45" r={r} fill="none" stroke="#1DB954" strokeWidth="1"/>
                        ))}
                        <circle cx="45" cy="45" r="5" fill="#1DB954" opacity="0.6"/>
                        <circle cx="45" cy="45" r="2" fill="#0e0e0e"/>
                      </svg>
                      {/* Year badge */}
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        fontFamily: "'DM Mono', monospace", fontSize: '10px',
                        color: isOpen ? '#1DB954' : '#333',
                        letterSpacing: '0.08em', transition: 'color 0.3s',
                      }}>{album.releaseYear}</div>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '14px 16px' }}>
                      <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '16px', color: '#e8e8e8', margin: '0 0 6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#1DB954', letterSpacing: '0.08em' }}>{album.songs?.length || 0} songs</span>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#333', transition: 'color 0.2s' }}>{isOpen ? '▲ hide' : '▼ show'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded tracklist */}
                  {isOpen && (
                    <div style={{
                      marginTop: 6,
                      background: '#0e0e0e',
                      border: '1px solid rgba(29,185,84,0.15)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      display: 'flex', flexDirection: 'column', gap: 4,
                      animation: 'fadeUp 0.25s ease both',
                    }}>
                      {!album.songs?.length ? (
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#333', padding: '8px 0', textAlign: 'center' }}>No songs yet</p>
                      ) : album.songs.map((song, j) => (
                        <div key={song.id} className="album-song-row">
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '14px', color: '#ccc', margin: '0 0 2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</p>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#333', margin: 0 }}>{song.genre?.name}</p>
                          </div>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#444', flexShrink: 0 }}>{fmt(song.duration)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};