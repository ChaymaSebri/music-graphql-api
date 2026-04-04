import React, { useState, useEffect } from 'react';
import { theme } from '../styles/theme.js';
import { Button } from './UI.jsx';

// Inject Google Fonts + keyframes
const styleTag = document.createElement('style');
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulse-ring {
    0%   { transform: scale(0.95); opacity: 0.6; }
    50%  { transform: scale(1.05); opacity: 0.2; }
    100% { transform: scale(0.95); opacity: 0.6; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% center; }
    100% { background-position: 200% center; }
  }

  .login-input:focus {
    outline: none;
    border-color: #1DB954 !important;
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.15), inset 0 1px 2px rgba(0,0,0,0.4) !important;
  }
  .login-input::placeholder { color: #4a4a4a; }
  .login-input option { background: #121212; color: #fff; }

  .role-btn {
    cursor: pointer;
    transition: all 0.2s ease;
    background: transparent;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    padding: 12px 0;
    color: #6a6a6a;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    flex: 1;
  }
  .role-btn:hover {
    border-color: #1DB954;
    color: #1DB954;
    background: rgba(29, 185, 84, 0.05);
  }
  .role-btn.active {
    border-color: #1DB954;
    color: #1DB954;
    background: rgba(29, 185, 84, 0.1);
  }

  .signin-btn {
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #1DB954 0%, #169a45 100%);
    border: none;
    border-radius: 8px;
    color: #000;
    font-family: 'DM Serif Display', serif;
    font-size: 16px;
    letter-spacing: 0.04em;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.25s ease;
  }
  .signin-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 200%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    transition: left 0.5s ease;
  }
  .signin-btn:hover::before { left: 100%; }
  .signin-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(29, 185, 84, 0.4);
  }
  .signin-btn:active { transform: translateY(0); }
  .signin-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

  .card-fade-1 { animation: fadeUp 0.5s ease both; }
  .card-fade-2 { animation: fadeUp 0.5s ease 0.08s both; }
  .card-fade-3 { animation: fadeUp 0.5s ease 0.16s both; }
  .card-fade-4 { animation: fadeUp 0.5s ease 0.24s both; }
  .card-fade-5 { animation: fadeUp 0.5s ease 0.32s both; }
  .card-fade-6 { animation: fadeUp 0.5s ease 0.40s both; }
`;
if (!document.head.querySelector('[data-login-styles]')) {
  styleTag.setAttribute('data-login-styles', '');
  document.head.appendChild(styleTag);
}

// Vinyl SVG background
const VinylBg = () => (
  <svg
    style={{ position: 'absolute', right: '-80px', top: '-80px', opacity: 0.05, pointerEvents: 'none' }}
    width="400" height="400" viewBox="0 0 400 400"
  >
    {[10,30,50,70,90,110,130,150,170,190].map((r, i) => (
      <circle key={i} cx="200" cy="200" r={r} fill="none" stroke="#1DB954" strokeWidth="1.5"/>
    ))}
    <circle cx="200" cy="200" r="30" fill="#1DB954" opacity="0.5"/>
    <circle cx="200" cy="200" r="12" fill="#121212"/>
  </svg>
);

// Waveform decoration
const Waveform = () => {
  const bars = [3,6,10,14,9,16,11,5,13,8,15,7,12,4,10,6,14,9,3,11];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px', opacity: 0.5 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: '2px',
          height: `${h}px`,
          backgroundColor: '#1DB954',
          borderRadius: '1px',
        }}/>
      ))}
    </div>
  );
};

export const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('listener@example.com');
  const [role, setRole] = useState('LISTENER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tokens = {
    ARTIST:   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoiYXJ0aXN0QGV4YW1wbGUuY29tIiwicm9sZSI6IkFSVElTVCJ9.kLQigrAdQBgQQYFxJ7T2sK4dtKKGyrUM8G-o31YOQGI',
    LISTENER: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTQ1NiIsImVtYWlsIjoibGlzdGVuZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiTElTVEVORVIifQ.Shgmn8LP1xh29qA0kFMnwOa1EnmajJapNiYHsOjLpVs'
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !role) {
      setError('Please enter your email and select a role');
      setLoading(false);
      return;
    }

    const token = tokens[role];

    try {
      const response = await fetch('http://localhost:4000/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ query: '{ stats { songs } }' }),
      });

      const data = await response.json();

      if (data.errors) {
        setError('Authentication failed. Please try again.');
        setLoading(false);
        return;
      }

      onLogin(token, role, email);
    } catch (err) {
      setError('Connection error. Is the API running on localhost:4000?');
      setLoading(false);
    }
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    color: '#6a6a6a',
    fontSize: '10px',
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  };

  const inputStyle = {
    width: '100%',
    padding: '13px 16px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: "'DM Mono', monospace",
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: '#0a0a0a',
      backgroundImage: `
        radial-gradient(ellipse 60% 50% at 70% 20%, rgba(29,185,84,0.07) 0%, transparent 70%),
        radial-gradient(ellipse 40% 60% at 20% 80%, rgba(29,185,84,0.04) 0%, transparent 70%)
      `,
      fontFamily: "'DM Serif Display', serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        padding: '48px 44px',
        backgroundColor: '#121212',
        border: '1px solid #1e1e1e',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(29,185,84,0.06)',
      }}>
        {/* Vinyl background decoration */}
        <VinylBg />

        {/* Amber top-edge glow */}
        <div style={{
          position: 'absolute',
          top: 0, left: '20%', right: '20%',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, #1DB954, transparent)',
          opacity: 0.6,
        }}/>

        {/* Header */}
        <div className="card-fade-1" style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <Waveform />
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 400,
            color: '#e8ddd0',            margin: '0 0 6px',
            letterSpacing: '-0.01em',
            lineHeight: 1,
          }}>
            Music<span style={{ color: '#1DB954', fontStyle: 'italic' }}>DB</span>
          </h1>
          <p style={{
            color: '#404040',
            fontSize: '11px',
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            margin: 0,
          }}>
            Your music, your story
          </p>
        </div>

        {/* Email field */}
        <div className="card-fade-2" style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="login-input"
            style={inputStyle}
          />
        </div>

        {/* Role selector */}
        <div className="card-fade-3" style={{ marginBottom: '28px' }}>
          <label style={labelStyle}>I am a</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['LISTENER', 'ARTIST'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`role-btn ${role === r ? 'active' : ''}`}
              >
                {r === 'LISTENER' ? '♫ Listener' : '✦ Artist'}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="card-fade-4" style={{
            marginBottom: '20px',
            padding: '12px 16px',
            backgroundColor: 'rgba(200,60,60,0.08)',
            border: '1px solid rgba(200,60,60,0.2)',
            borderRadius: '8px',
            color: '#e07070',
            fontSize: '12px',
            fontFamily: "'DM Mono', monospace",
          }}>
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="card-fade-5">
          <button
            className="signin-btn"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>

        {/* Footer hint */}
        <div className="card-fade-6" style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid #1e1e1e',
          textAlign: 'center',
        }}>
          <p style={{
            color: '#333',
            fontSize: '10px',
            fontFamily: "'DM Mono', monospace",
            letterSpacing: '0.1em',
            margin: 0,
          }}>
            Demo — use any email with either role
          </p>
        </div>
      </div>
    </div>
  );
};