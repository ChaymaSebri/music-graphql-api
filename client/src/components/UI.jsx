import React from 'react';
import { theme } from '../styles/theme.js';

// ─── Inject shared styles ───────────────────────────────────────────────────
const styleTag = document.createElement('style');
styleTag.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

  .mdb-input {
    width: 100%;
    padding: 10px 14px;
    background: #161616;
    border: 1px solid #1a1a1a;
    border-radius: 8px;
    color: #ccc;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    letter-spacing: 0.04em;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    outline: none;
    box-sizing: border-box;
  }
  .mdb-input::placeholder {
    color: #3a3a3a;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-size: 10px;
  }
  .mdb-input:focus {
    border-color: rgba(29,185,84,0.5);
    box-shadow: 0 0 0 3px rgba(29,185,84,0.08);
  }

  .mdb-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    font-family: 'DM Mono', monospace;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
  }
  .mdb-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .mdb-btn-primary {
    background: #1DB954;
    color: #0e0e0e;
    border: 1px solid #1DB954;
  }
  .mdb-btn-primary:not(:disabled):hover {
    background: #17a348;
    box-shadow: 0 0 12px rgba(29,185,84,0.25);
    transform: translateY(-1px);
  }
  .mdb-btn-secondary {
    background: transparent;
    color: #5a5a5a;
    border: 1px solid #2a2a2a;
  }
  .mdb-btn-secondary:not(:disabled):hover {
    border-color: #3a3a3a;
    color: #ccc;
    background: rgba(255,255,255,0.04);
  }
  .mdb-btn-sm  { padding: 6px 12px;  font-size: 10px; }
  .mdb-btn-md  { padding: 10px 18px; font-size: 11px; }
  .mdb-btn-lg  { padding: 13px 24px; font-size: 13px; }

  .mdb-card {
    background: #161616;
    border-radius: 10px;
    border: 1px solid transparent;
    transition: background 0.2s ease, border-color 0.2s ease;
  }
  .mdb-card.clickable { cursor: pointer; }
  .mdb-card.clickable:hover {
    background: #1a1a1a;
    border-color: rgba(29,185,84,0.2);
  }
`;
if (!document.head.querySelector('[data-mdb-styles]')) {
  styleTag.setAttribute('data-mdb-styles', '');
  document.head.appendChild(styleTag);
}

// ─── Header ─────────────────────────────────────────────────────────────────
export const Header = ({ title, subtitle }) => (
  <div style={{
    backgroundColor: '#0e0e0e',
    padding: '24px 28px 20px',
    borderBottom: '1px solid #1a1a1a',
    marginBottom: '24px',
  }}>
    <h2 style={{
      fontFamily: "'DM Serif Display', serif",
      fontSize: '26px',
      fontWeight: 400,
      color: '#fff',
      marginBottom: subtitle ? '6px' : 0,
      lineHeight: 1.2,
    }}>
      {title}
      <span style={{ color: '#1DB954', fontStyle: 'italic' }}>.</span>
    </h2>
    {subtitle && (
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: '11px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#3a3a3a',
        margin: 0,
      }}>
        {subtitle}
      </p>
    )}
  </div>
);

// ─── Card ────────────────────────────────────────────────────────────────────
export const Card = ({ children, onClick, style = {} }) => (
  <div
    className={`mdb-card ${onClick ? 'clickable' : ''}`}
    onClick={onClick}
    style={{ padding: '16px', ...style }}
  >
    {children}
  </div>
);

// ─── Button ──────────────────────────────────────────────────────────────────
export const Button = ({ children, onClick, primary = true, disabled = false, size = 'md' }) => (
  <button
    className={`mdb-btn mdb-btn-${primary ? 'primary' : 'secondary'} mdb-btn-${size}`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

// ─── SearchInput ─────────────────────────────────────────────────────────────
export const SearchInput = ({ placeholder, value, onChange }) => (
  <input
    type="text"
    className="mdb-input"
    placeholder={placeholder}
    value={value}
    onChange={(e) => onChange(e.target.value)}
  />
);