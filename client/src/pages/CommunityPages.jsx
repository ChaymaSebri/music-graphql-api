import React, { useEffect, useState } from 'react';
import { theme } from '../styles/theme.js';
import { icons } from '../constants/icons.jsx';
import {
  fetchGraphQL,
  GET_MY_PLAYLISTS,
  GET_MY_REVIEWS,
  DELETE_PLAYLIST_MUTATION,
  DELETE_REVIEW_MUTATION,
  UPDATE_PLAYLIST_MUTATION,
} from '../graphql/api.js';

// ─── Inject styles once ──────────────────────────────────────────────────────
const styleTag = document.createElement('style');
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.96) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }

  .lp-fadeup { animation: fadeUp 0.4s ease both; }

  /* ── Modal ── */
  .modal-input {
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
    resize: vertical;
  }
  .modal-input:focus {
    outline: none;
    border-color: #1DB954;
    box-shadow: 0 0 0 3px rgba(29,185,84,0.12);
  }
  .modal-input::placeholder { color: #3a3a3a; }
  .modal-input option { background: #1a1a1a; }

  /* ── Buttons ── */
  .btn-green {
    padding: 10px 18px;
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
  }
  .btn-green:hover { background: #22d461; transform: translateY(-1px); box-shadow: 0 4px 16px rgba(29,185,84,0.3); }
  .btn-green:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

  .btn-ghost {
    padding: 10px 18px;
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
  }
  .btn-ghost:hover { border-color: #444; color: #aaa; }

  .btn-danger {
    padding: 8px 14px;
    background: transparent;
    border: 1px solid rgba(224,85,85,0.25);
    border-radius: 8px;
    color: #e05555;
    font-family: 'DM Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  .btn-danger:hover { background: rgba(224,85,85,0.08); border-color: rgba(224,85,85,0.5); }
  .btn-danger:disabled { opacity: 0.35; cursor: not-allowed; }

  .btn-icon {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    background: transparent;
    border: 1px solid #222;
    border-radius: 6px;
    color: #444;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .btn-icon:hover { border-color: #444; color: #aaa; }

  /* ── Cards ── */
  .pl-card {
    background: #121212;
    border: 1px solid #1e1e1e;
    border-radius: 12px;
    overflow: hidden;
    transition: border-color 0.2s;
  }
  .pl-card:hover { border-color: #2a2a2a; }
  .pl-card.expanded { border-color: rgba(29,185,84,0.2); }

  .song-row-sm {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    border-radius: 8px;
    background: #0e0e0e;
    transition: background 0.2s;
    gap: 12px;
  }
  .song-row-sm:hover { background: #161616; }

  /* ── Score ring ── */
  .score-badge {
    width: 44px; height: 44px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Serif Display', serif;
    font-size: 16px;
    flex-shrink: 0;
  }

  /* ── Range slider ── */
  input[type=range] {
    -webkit-appearance: none;
    width: 100%; height: 4px;
    background: #2a2a2a;
    border-radius: 2px;
    outline: none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #1DB954;
    cursor: pointer;
    box-shadow: 0 0 6px rgba(29,185,84,0.5);
  }
`;
if (!document.head.querySelector('[data-listener-styles]')) {
  styleTag.setAttribute('data-listener-styles', '');
  document.head.appendChild(styleTag);
}

// ─── Shared ──────────────────────────────────────────────────────────────────

const PageHeader = ({ title, subtitle }) => (
  <div style={{ padding: '32px 32px 24px', borderBottom: '1px solid #1a1a1a' }}>
    <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', fontWeight: 400, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.01em' }}>{title}</h2>
    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#404040', margin: 0 }}>{subtitle}</p>
  </div>
);

const LoadingState = ({ label }) => (
  <div style={{ padding: '48px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
    <div style={{ height: 2, width: 100, background: 'linear-gradient(90deg,#1a1a1a,#1DB954,#1a1a1a)', backgroundSize: '200% 100%', borderRadius: 2, animation: 'shimmer 1.4s ease infinite' }}/>
    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
  </div>
);

const Empty = ({ message }) => (
  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#333', letterSpacing: '0.08em', padding: '40px 32px' }}>{message}</p>
);

const fmt = (ms) => {
  const m = Math.floor(ms / 60000);
  const s = ((ms % 60000) / 1000).toFixed(0);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const scoreColor = (n) => {
  if (n >= 8) return '#1DB954';
  if (n >= 5) return '#facc15';
  return '#e05555';
};

// ─── SongDetailModal ─────────────────────────────────────────────────────────

export const SongDetailModal = ({ song, playlists, onClose, onAddToPlaylist, onAddReview }) => {
  const [showPlaylistForm, setShowPlaylistForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [reviewData, setReviewData] = useState({ content: '', score: 5 });
  const [submitting, setSubmitting] = useState(false);

  if (!song) return null;

  const handleCreatePlaylist = async () => {
    if (!playlistName.trim()) return alert('Playlist name required');
    setSubmitting(true);
    try {
      await onAddToPlaylist(song.id, null, playlistName.trim(), playlistDescription.trim() || null);
      setPlaylistName(''); setPlaylistDescription(''); setShowPlaylistForm(false);
    } finally { setSubmitting(false); }
  };

  const handleAddToExisting = async () => {
    if (!selectedPlaylistId) return alert('Please select a playlist');
    setSubmitting(true);
    try {
      await onAddToPlaylist(song.id, selectedPlaylistId, null);
      setSelectedPlaylistId('');
    } finally { setSubmitting(false); }
  };

  const handleSubmitReview = async () => {
    if (!reviewData.content.trim()) return alert('Review content required');
    setSubmitting(true);
    try {
      await onAddReview(song.id, reviewData.content.trim(), parseInt(reviewData.score, 10));
      setReviewData({ content: '', score: 5 }); setShowReviewForm(false);
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        width: '90%', maxWidth: 560,
        maxHeight: '85vh', overflowY: 'auto',
        background: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: 16,
        animation: 'modalIn 0.3s ease both',
        boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid #1a1a1a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          position: 'sticky', top: 0, background: '#111', zIndex: 1,
        }}>
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '22px', fontWeight: 400, color: '#fff', margin: '0 0 6px' }}>{song.title}</h2>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#444', margin: 0, letterSpacing: '0.06em' }}>
              <span style={{ color: '#1DB954' }}>{song.artist.name}</span>
              <span style={{ margin: '0 8px', color: '#2a2a2a' }}>·</span>
              {song.genre.name}
              <span style={{ margin: '0 8px', color: '#2a2a2a' }}>·</span>
              {fmt(song.duration)}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} style={{ marginTop: 2 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 1l10 10M11 1L1 11"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Playlist section ── */}
          <section>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#333', margin: '0 0 12px' }}>Add to Playlist</p>

            {!showPlaylistForm ? (
              <button className="btn-ghost" style={{ width: '100%' }} onClick={() => setShowPlaylistForm(true)}>
                + Manage Playlists
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {playlists.length > 0 && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={selectedPlaylistId} onChange={e => setSelectedPlaylistId(e.target.value)} className="modal-input" style={{ flex: 1 }}>
                      <option value="">Select existing playlist…</option>
                      {playlists.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button className="btn-green" onClick={handleAddToExisting} disabled={submitting}>Add</button>
                  </div>
                )}

                <div style={{ borderTop: '1px solid #1e1e1e', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Or create new</p>
                  <input className="modal-input" value={playlistName} onChange={e => setPlaylistName(e.target.value)} placeholder="Playlist name" />
                  <textarea className="modal-input" value={playlistDescription} onChange={e => setPlaylistDescription(e.target.value)} placeholder="Description (optional)" rows={2}/>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-green" style={{ flex: 1 }} onClick={handleCreatePlaylist} disabled={submitting}>Create & Add</button>
                    <button className="btn-ghost" onClick={() => { setShowPlaylistForm(false); setPlaylistName(''); setPlaylistDescription(''); setSelectedPlaylistId(''); }}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Review section ── */}
          <section style={{ borderTop: '1px solid #1a1a1a', paddingTop: 20 }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#333', margin: '0 0 12px' }}>Write a Review</p>

            {!showReviewForm ? (
              <button className="btn-ghost" style={{ width: '100%' }} onClick={() => setShowReviewForm(true)}>
                + Write Review
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea className="modal-input" value={reviewData.content} onChange={e => setReviewData(p => ({ ...p, content: e.target.value }))} placeholder="Share your thoughts…" rows={4}/>

                {/* Score slider */}
                <div style={{ background: '#0e0e0e', border: '1px solid #1e1e1e', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rating</span>
                    <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '20px', color: scoreColor(reviewData.score) }}>{reviewData.score}<span style={{ fontSize: '12px', color: '#333' }}>/10</span></span>
                  </div>
                  <input type="range" min="1" max="10" value={reviewData.score} onChange={e => setReviewData(p => ({ ...p, score: e.target.value }))}/>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-green" style={{ flex: 1 }} onClick={handleSubmitReview} disabled={submitting}>Submit</button>
                  <button className="btn-ghost" onClick={() => { setShowReviewForm(false); setReviewData({ content: '', score: 5 }); }}>Cancel</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

// ─── MyPlaylists ──────────────────────────────────────────────────────────────

export const MyPlaylists = ({ token }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchGraphQL(GET_MY_PLAYLISTS, {}, token)
      .then(d => setPlaylists(d.me?.playlists || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeleting(id);
    try {
      await fetchGraphQL(DELETE_PLAYLIST_MUTATION, { input: { id } }, token);
      setPlaylists(p => p.filter(x => x.id !== id));
      setExpandedPlaylist(null);
    } finally { setDeleting(null); }
  };

  const handleUpdate = async () => {
    if (!editForm.name.trim()) return alert('Name required');
    const result = await fetchGraphQL(UPDATE_PLAYLIST_MUTATION, { input: { id: editingId, name: editForm.name.trim(), description: editForm.description.trim() || null } }, token);
    setPlaylists(p => p.map(pl => pl.id === editingId ? result.updatePlaylist : pl));
    setEditingId(null);
  };

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="My Playlists" subtitle={`${playlists.length} playlist${playlists.length !== 1 ? 's' : ''}`} />
      <div style={{ padding: '28px 32px' }}>
        {loading ? <LoadingState label="Loading playlists" /> : playlists.length === 0 ? <Empty message="No playlists yet — add songs from the Songs page." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {playlists.map((pl, i) => (
              <div key={pl.id} className={`pl-card lp-fadeup ${expandedPlaylist === pl.id ? 'expanded' : ''}`} style={{ animationDelay: `${i * 0.05}s` }}>

                {editingId === pl.id ? (
                  /* ── Edit mode ── */
                  <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input className="modal-input" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Playlist name"/>
                    <textarea className="modal-input" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} placeholder="Description" rows={2}/>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-green" onClick={handleUpdate}>Save</button>
                      <button className="btn-ghost" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      {/* Toggle expand */}
                      <button
                        onClick={() => setExpandedPlaylist(expandedPlaylist === pl.id ? null : pl.id)}
                        style={{ flex: 1, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {/* Mini waveform icon */}
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: 16, flexShrink: 0 }}>
                            {[10,16,8,14,6].map((h, j) => (
                              <div key={j} style={{ width: 2, height: `${h}px`, borderRadius: 1, background: expandedPlaylist === pl.id ? '#1DB954' : '#333' }}/>
                            ))}
                          </div>
                          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#e8e8e8' }}>{pl.name}</span>
                        </div>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#444', margin: '4px 0 0 24px', letterSpacing: '0.08em' }}>
                          {pl.songCount} song{pl.songCount !== 1 ? 's' : ''}
                          {pl.description && <span style={{ color: '#2e2e2e' }}> · {pl.description}</span>}
                        </p>
                      </button>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button className="btn-icon" title="Edit" onClick={() => { setEditingId(pl.id); setEditForm({ name: pl.name, description: pl.description || '' }); }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M8.5 1.5l2 2-7 7H1.5v-2l7-7z"/>
                          </svg>
                        </button>
                        <button className="btn-icon" title="Delete" onClick={() => handleDelete(pl.id, pl.name)} disabled={deleting === pl.id} style={{ color: deleting === pl.id ? '#333' : undefined }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M1.5 3h9M4 3V2h4v1M5 5.5v4M7 5.5v4M2 3l.8 7.2A1 1 0 003.8 11h4.4a1 1 0 001-.8L10 3"/>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expanded songs */}
                    {expandedPlaylist === pl.id && (
                      <div style={{ borderTop: '1px solid #1a1a1a', padding: '16px', textAlign: 'center' }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '11px', color: '#666', margin: 0 }}>Containing {pl.songCount} song{pl.songCount !== 1 ? 's' : ''} — Open playlist to see details</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── MyReviews ────────────────────────────────────────────────────────────────

export const MyReviews = ({ token }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchGraphQL(GET_MY_REVIEWS, {}, token)
      .then(d => setReviews(d.me?.reviews || []))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete review for "${title}"?`)) return;
    setDeleting(id);
    try {
      await fetchGraphQL(DELETE_REVIEW_MUTATION, { input: { id } }, token);
      setReviews(p => p.filter(r => r.id !== id));
    } finally { setDeleting(null); }
  };

  return (
    <div style={{ width: '100%' }}>
      <PageHeader title="My Reviews" subtitle={`${reviews.length} review${reviews.length !== 1 ? 's' : ''}`} />
      <div style={{ padding: '28px 32px' }}>
        {loading ? <LoadingState label="Loading reviews" /> : reviews.length === 0 ? <Empty message="No reviews yet — click a song to write one." /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reviews.map((review, i) => {
              const color = scoreColor(review.score);
              return (
                <div key={review.id} className="pl-card lp-fadeup" style={{ animationDelay: `${i * 0.05}s`, padding: '18px 20px' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

                    {/* Score badge */}
                    <div className="score-badge" style={{
                      background: `radial-gradient(circle at 35% 35%, ${color}33, ${color}11)`,
                      border: `1px solid ${color}44`,
                      color,
                    }}>
                      {review.score}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                        <div>
                          <p style={{ fontFamily: "'DM Serif Display', serif", fontSize: '17px', color: '#e8e8e8', margin: '0 0 3px' }}>{review.song.title}</p>
                          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '10px', color: '#1DB954', margin: 0, letterSpacing: '0.06em' }}>{review.song.artist.name}</p>
                        </div>
                        <button className="btn-danger" onClick={() => handleDelete(review.id, review.song.title)} disabled={deleting === review.id}>
                          {deleting === review.id ? '…' : 'Delete'}
                        </button>
                      </div>

                      {/* Score bar */}
                      <div style={{ width: '100%', height: 2, background: '#1e1e1e', borderRadius: 1, marginBottom: 10, overflow: 'hidden' }}>
                        <div style={{ width: `${review.score * 10}%`, height: '100%', background: color, borderRadius: 1, transition: 'width 0.6s ease' }}/>
                      </div>

                      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px', color: '#555', margin: 0, lineHeight: 1.6 }}>{review.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};