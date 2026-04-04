import React from 'react';
import { theme } from '../styles/theme.js';

// Inject styles once
const styleTag = document.createElement('style');
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-12px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .nav-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #5a5a5a;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: color 0.2s ease, background 0.2s ease;
    animation: slideIn 0.4s ease both;
  }
  .nav-item:hover {
    color: #ccc;
    background: rgba(255,255,255,0.04);
  }
  .nav-item.active {
    color: #1DB954;
    background: rgba(29,185,84,0.08);
    font-weight: 400;
  }
  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0; top: 20%; bottom: 20%;
    width: 3px;
    background: #1DB954;
    border-radius: 0 3px 3px 0;
  }

  .nav-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    opacity: 0.5;
    transition: opacity 0.2s;
  }
  .nav-item:hover .nav-icon,
  .nav-item.active .nav-icon {
    opacity: 1;
  }

  .section-label {
    font-family: 'DM Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #333;
    padding: 0 14px;
    margin: 4px 0 2px;
  }

  .signout-btn {
    width: 100%;
    padding: 11px 14px;
    background: transparent;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    color: #5a5a5a;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.2s ease;
  }
  .signout-btn:hover {
    border-color: #e05555;
    color: #e05555;
    background: rgba(224,85,85,0.06);
  }
`;
if (!document.head.querySelector('[data-sidebar-styles]')) {
  styleTag.setAttribute('data-sidebar-styles', '');
  document.head.appendChild(styleTag);
}

// SVG icons
const icons = {
  dashboard: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1.5"/>
    </svg>
  ),
  songs: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 12V4l8-2v8"/>
      <circle cx="4" cy="12" r="2"/>
      <circle cx="12" cy="10" r="2"/>
    </svg>
  ),
  artists: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="3"/>
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
    </svg>
  ),
  genres: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4h12M4 8h8M6 12h4"/>
    </svg>
  ),
  'my-albums': (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="6"/>
      <circle cx="8" cy="8" r="2"/>
      <circle cx="8" cy="8" r="0.5" fill="currentColor"/>
    </svg>
  ),
  'my-songs': (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 12V4l8-2v8"/>
      <circle cx="4" cy="12" r="2"/>
      <circle cx="12" cy="10" r="2"/>
      <path d="M10 6l2-.5" strokeLinecap="round"/>
    </svg>
  ),
  reviews: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2l1.5 3 3.5.5-2.5 2.5.6 3.5L8 10l-3.1 1.5.6-3.5L3 5.5l3.5-.5z"/>
    </svg>
  ),
  playlists: (
    <svg className="nav-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 4h8M2 8h6M2 12h4"/>
      <circle cx="12" cy="10" r="2.5"/>
      <path d="M14.5 7.5v5"/>
    </svg>
  ),
  signout: (
    <svg style={{ width: 14, height: 14, flexShrink: 0 }} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"/>
      <path d="M11 11l3-3-3-3M14 8H6"/>
    </svg>
  ),
};

export const Sidebar = ({ activePage, setActivePage, onLogout, role }) => {
  const coreItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'songs',     label: 'Songs' },
    { id: 'artists',   label: 'Artists' },
    { id: 'genres',    label: 'Genres' },
  ];

  const roleItems = role === 'ARTIST'
    ? [{ id: 'my-albums', label: 'My Albums' }, { id: 'my-songs', label: 'My Songs' }]
    : [{ id: 'reviews', label: 'My Reviews' }, { id: 'playlists', label: 'My Playlists' }];

  return (
    <div style={{
      width: '220px',
      minWidth: '220px',
      backgroundColor: '#0e0e0e',
      borderRight: '1px solid #1a1a1a',
      display: 'flex',
      flexDirection: 'column',
      padding: '28px 12px 20px',
      overflowY: 'auto',
    }}>

      {/* Logo */}
      <div style={{ padding: '0 14px', marginBottom: '32px' }}>
        <div style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '22px',
          fontWeight: 400,
          color: '#fff',
          lineHeight: 1,
          marginBottom: '6px',
        }}>
          Music<span style={{ color: '#1DB954', fontStyle: 'italic' }}>DB</span>
        </div>
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: '9px',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#333',
        }}>
          API Client
        </div>
      </div>

      {/* Role badge */}
      <div style={{ padding: '0 14px', marginBottom: '24px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '20px',
          border: '1px solid rgba(29,185,84,0.2)',
          background: 'rgba(29,185,84,0.06)',
        }}>
          <div style={{
            width: '6px', height: '6px',
            borderRadius: '50%',
            backgroundColor: '#1DB954',
            boxShadow: '0 0 6px #1DB954',
          }}/>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#1DB954',
          }}>
            {role === 'ARTIST' ? 'Artist' : 'Listener'}
          </span>
        </div>
      </div>

      {/* Core nav */}
      <div style={{ marginBottom: '8px' }}>
        <div className="section-label">Browse</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
          {coreItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {icons[item.id]}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Role-specific nav */}
      <div>
        <div className="section-label" style={{ marginTop: '16px' }}>
          {role === 'ARTIST' ? 'Your Music' : 'Your Library'}
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '6px' }}>
          {roleItems.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              style={{ animationDelay: `${(i + 4) * 0.05}s` }}
            >
              {icons[item.id]}
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Sign out */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '20px',
        borderTop: '1px solid #1a1a1a',
      }}>
        <button className="signout-btn" onClick={onLogout}>
          {icons.signout}
          Sign Out
        </button>
      </div>
    </div>
  );
};