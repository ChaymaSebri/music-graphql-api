import React, { useEffect, useState } from 'react';
import { theme } from '../styles/theme.js';
import { fetchGraphQL, STATS_QUERY, SONGS_QUERY, ARTISTS_QUERY, GENRES_QUERY } from '../graphql/api.js';
import { icons } from '../constants/icons.jsx';

// ─── Shared styles injected once ───────────────────────────────────────────
const styleTag = document.createElement('style');
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }

  .page-fadeup {
    animation: fadeUp 0.45s ease both;
  }

  /* Stat cards */
  .stat-card {
    background: #121212;
    border: 1px solid #1e1e1e;
    border-radius: 12px;
    padding: 28px 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.25s, transform 0.25s;
  }
  .stat-card::after {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(29,185,84,0.07), transparent);
    pointer-events: none;
  }
  .stat-card:hover {
    border-color: rgba(29,185,84,0.3);
    transform: translateY(-2px);
  }

  /* Song rows */
  .song-row {
    background: #121212;
    border: 1px solid #1e1e1e;
    border-radius: 10px;
    padding: 16px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    transition: border-color 0.2s, background 0.2s;
  }
  .song-row:hover {
    background: #181818;
    border-color: #2a2a2a;
  }
  .song-row.clickable { cursor: pointer; }
  .song-row.clickable:hover { border-color: rgba(29,185,84,0.25); }

  /* Artist cards */
  .artist-card {
    background: #121212;
    border: 1px solid #1e1e1e;
    border-radius: 12px;
    padding: 28px 16px 20px;
    text-align: center;
    transition: border-color 0.2s, transform 0.2s;
    position: relative;
    overflow: hidden;
  }
  .artist-card:hover {
    border-color: rgba(29,185,84,0.25);
    transform: translateY(-2px);
  }

  /* Genre pills */
  .genre-pill {
    background: #121212;
    border: 1px solid #1e1e1e;
    border-radius: 10px;
    padding: 18px 12px;
    text-align: center;
    transition: border-color 0.2s, background 0.2s;
    cursor: default;
  }
  .genre-pill:hover {
    background: #181818;
    border-color: rgba(29,185,84,0.25);
  }

  /* Pagination */
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
  .pg-btn:hover:not(:disabled) {
    border-color: #1DB954;
    color: #1DB954;
  }
  .pg-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* Loading pulse */
  .loading-bar {
    height: 2px;
    width: 120px;
    background: linear-gradient(90deg, #1a1a1a, #1DB954, #1a1a1a);
    background-size: 200% 100%;
    border-radius: 2px;
    animation: shimmer 1.4s ease infinite;
  }
`;
if (!document.head.querySelector('[data-pages-styles]')) {
  styleTag.setAttribute('data-pages-styles', '');
  document.head.appendChild(styleTag);
}

// ─── Shared primitives ──────────────────────────────────────────────────────

const PageHeader = ({ title, subtitle, action }) => (
  <div style={{
    padding: '32px 32px 24px',
    borderBottom: '1px solid #1a1a1a',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  }}>
    <div>
      <h2 style={{
        fontFamily: "'DM Serif Display', serif",
        fontSize: '28px',
        fontWeight: 400,
        color: '#fff',
        margin: '0 0 6px',
        letterSpacing: '-0.01em',
      }}>{title}</h2>
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '11px',
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#404040',
        margin: 0,
      }}>{subtitle}</p>
    </div>
    {action}
  </div>
);

const LoadingState = ({ label = 'Loading' }) => (
  <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
    <div className="loading-bar"/>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
  </div>
);

const Pagination = ({ skip, perPage, onPrev, onNext, disableNext }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 32, justifyContent: 'center' }}>
    <button className="pg-btn" onClick={onPrev} disabled={skip === 0}>← Prev</button>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#444', letterSpacing: '0.1em' }}>
      pg {Math.floor(skip / perPage) + 1}
    </span>
    <button className="pg-btn" onClick={onNext} disabled={disableNext}>Next →</button>
  </div>
);

// ─── Dashboard ──────────────────────────────────────────────────────────────

export const Dashboard = ({ token }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGraphQL(STATS_QUERY, {}, token)
      .then(d => setStats(d.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <LoadingState label="Loading statistics" />;
  if (!stats) return null;

  const statCards = [
    { label: 'Total Songs',  value: stats.songs,   icon: '♫', accent: '#1DB954' },
    { label: 'Artists',      value: stats.artists,  icon: '✦', accent: '#4db8ff' },
    { label: 'Albums',       value: stats.albums,   icon: '◎', accent: '#c084fc' },
    { label: 'Genres',       value: stats.genres,   icon: '≡', accent: '#fb923c' },
  ];

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Dashboard" subtitle="MusicDB overview" />
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {statCards.map((card, i) => (
            <div key={card.label} className="stat-card page-fadeup" style={{ animationDelay: `${i * 0.07}s` }}>
              <span style={{ fontSize: '20px', color: card.accent, opacity: 0.8 }}>{card.icon}</span>
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#555',
                margin: 0,
              }}>{card.label}</p>
              <p style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '38px',
                fontWeight: 400,
                color: card.accent,
                margin: 0,
                lineHeight: 1,
              }}>{card.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Songs ──────────────────────────────────────────────────────────────────

export const Songs = ({ token, role, onSongClick }) => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const PER_PAGE = 15;

  useEffect(() => {
    setLoading(true);
    fetchGraphQL(SONGS_QUERY, { skip, take: PER_PAGE }, token)
      .then(d => setSongs(d.songs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [skip, token]);

  const fmt = (ms) => {
    const m = Math.floor(ms / 60000);
    const s = ((ms % 60000) / 1000).toFixed(0);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Songs"
        subtitle={`${skip + 1}–${skip + songs.length} of many`}
      />
      <div style={{ padding: '28px 32px' }}>
        {loading ? <LoadingState label="Loading songs" /> : (
          <>
            {/* Column header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              padding: '0 20px 10px',
              borderBottom: '1px solid #1a1a1a',
              marginBottom: 8,
            }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#333' }}>Track</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#333' }}>Info</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {songs.map((song, i) => (
                <div
                  key={song.id}
                  onClick={() => role === 'LISTENER' && onSongClick?.(song)}
                  className={`song-row page-fadeup ${role === 'LISTENER' ? 'clickable' : ''}`}
                  style={{ animationDelay: `${i * 0.025}s` }}
                >
                  {/* Left: title + meta */}
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: '16px',
                      fontWeight: 400,
                      color: '#e8e8e8',
                      margin: '0 0 4px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{song.title}</p>
                    <p style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '11px',
                      color: '#444',
                      margin: 0,
                    }}>
                      <span style={{ color: '#1DB954' }}>{song.artist.name}</span>
                      <span style={{ margin: '0 8px', color: '#2a2a2a' }}>·</span>
                      {song.genre.name}
                    </p>
                  </div>

                  {/* Right: duration + popularity + explicit */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
                    {/* Popularity bar */}
                    {song.popularity != null && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <div style={{ width: 60, height: 3, background: '#1e1e1e', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ width: `${song.popularity}%`, height: '100%', background: '#1DB954', borderRadius: 2 }}/>
                        </div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '9px', color: '#333', letterSpacing: '0.08em' }}>{song.popularity}</span>
                      </div>
                    )}

                    {/* Explicit badge */}
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '9px',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: 4,
                      background: song.explicit ? 'rgba(224,85,85,0.12)' : 'rgba(29,185,84,0.08)',
                      color: song.explicit ? '#e05555' : '#1DB954',
                      border: `1px solid ${song.explicit ? 'rgba(224,85,85,0.2)' : 'rgba(29,185,84,0.15)'}`,
                    }}>
                      {song.explicit ? 'E' : 'Clean'}
                    </span>

                    {/* Duration */}
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '13px', color: '#555', minWidth: 36, textAlign: 'right' }}>
                      {fmt(song.duration)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Pagination skip={skip} perPage={PER_PAGE} onPrev={() => setSkip(Math.max(0, skip - PER_PAGE))} onNext={() => setSkip(skip + PER_PAGE)} />
          </>
        )}
      </div>
    </div>
  );
};

// ─── Artists ─────────────────────────────────────────────────────────────────

const AVATAR_COLORS = ['#1DB954','#4db8ff','#c084fc','#fb923c','#f472b6','#34d399'];

export const Artists = ({ token }) => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const PER_PAGE = 21;

  useEffect(() => {
    setLoading(true);
    fetchGraphQL(ARTISTS_QUERY, { skip, take: PER_PAGE }, token)
      .then(d => setArtists(d.artists))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [skip, token]);

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Artists" subtitle="Browse all artists in the database" />
      <div style={{ padding: '28px 32px' }}>
        {loading ? <LoadingState label="Loading artists" /> : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
              {artists.map((artist, i) => {
                const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
                const initials = artist.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div key={artist.id} className="artist-card page-fadeup" style={{ animationDelay: `${i * 0.04}s` }}>
                    {/* Avatar circle */}
                    <div style={{
                      width: 56, height: 56,
                      borderRadius: '50%',
                      background: `radial-gradient(circle at 35% 35%, ${color}55, ${color}22)`,
                      border: `1px solid ${color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 14px',
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: '18px',
                      color,
                    }}>{initials}</div>

                    <p style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: '15px',
                      color: '#e8e8e8',
                      margin: '0 0 6px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{artist.name}</p>

                    <p style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      color,
                      margin: 0,
                    }}>{artist.songs.length} songs</p>
                  </div>
                );
              })}
            </div>
            <Pagination skip={skip} perPage={PER_PAGE} onPrev={() => setSkip(Math.max(0, skip - PER_PAGE))} onNext={() => setSkip(skip + PER_PAGE)} />
          </>
        )}
      </div>
    </div>
  );
};

// ─── Genres ──────────────────────────────────────────────────────────────────

const GENRE_ACCENT = ['#1DB954','#4db8ff','#c084fc','#fb923c','#f472b6','#34d399','#facc15','#a78bfa'];

export const Genres = ({ token }) => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [skip, setSkip] = useState(0);
  const PER_PAGE = 18;

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchGraphQL(GENRES_QUERY, { skip, take: PER_PAGE }, token)
      .then(d => setGenres(d.genres || []))
      .catch(err => { setError(err.message); setGenres([]); })
      .finally(() => setLoading(false));
  }, [skip, token]);

  const hasMore = genres.length === PER_PAGE;

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="Genres" subtitle="All music genres in the database" />
      <div style={{ padding: '28px 32px' }}>
        {error && (
          <div style={{
            marginBottom: 20, padding: '12px 16px',
            background: 'rgba(224,85,85,0.08)',
            border: '1px solid rgba(224,85,85,0.2)',
            borderRadius: 8,
            fontFamily: "'DM Mono', monospace",
            fontSize: '12px', color: '#e05555',
          }}>Error: {error}</div>
        )}
        {loading ? <LoadingState label="Loading genres" /> : genres.length === 0 ? (
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#333' }}>No genres found.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {genres.map((genre, i) => {
                const accent = GENRE_ACCENT[i % GENRE_ACCENT.length];
                return (
                  <div key={genre.id} className="genre-pill page-fadeup" style={{ animationDelay: `${i * 0.03}s`, padding: '24px 18px' }}>
                    <div style={{
                      width: 32, height: 3,
                      background: accent,
                      borderRadius: 2,
                      margin: '0 auto 14px',
                      opacity: 0.7,
                    }}/>
                    <p style={{
                      fontFamily: "'DM Serif Display', serif",
                      fontSize: '16px',
                      color: '#ddd',
                      margin: '0 0 8px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>{genre.name}</p>
                    <p style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: '11px',
                      letterSpacing: '0.1em',
                      color: accent,
                      margin: 0,
                    }}>{genre.songs.length} songs</p>
                  </div>
                );
              })}
            </div>
            <Pagination
              skip={skip}
              perPage={PER_PAGE}
              onPrev={() => setSkip(Math.max(0, skip - PER_PAGE))}
              onNext={() => setSkip(skip + PER_PAGE)}
              disableNext={!hasMore}
            />
          </>
        )}
      </div>
    </div>
  );
};