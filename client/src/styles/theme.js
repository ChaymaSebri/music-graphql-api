export const theme = {
  colors: {
    primary: '#1DB954',        // Spotify Green
    darkBg: '#0a0a0a',         // Very dark background (new)
    sidebarBg: '#121212',      // Dark card/sidebar background
    cardBg: '#1a1a1a',         // Input and element background (darker)
    border: '#1e1e1e',         // Border color (new)
    text: '#e8ddd0',           // Off-white/beige text (new)
    textSecondary: '#6a6a6a',  // Medium gray (new)
    textTertiary: '#404040',   // Darker gray labels (new)
    hover: '#1ed760',          // Light green on hover
    accent: '#1DB954',         // Primary accent
    error: '#e07070',          // Error red (new)
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
  },
  fonts: {
    serif: "'DM Serif Display', serif",
    mono: "'DM Mono', monospace",
    sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    width: 100%;
    height: 100%;
  }

  #root {
    width: 100%;
    height: 100%;
  }

  body {
    font-family: ${theme.fonts.sans};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: linear-gradient(135deg, ${theme.colors.darkBg} 0%, #0f0f0f 100%);
    color: ${theme.colors.text};
    overflow: hidden;
  }

  a {
    text-decoration: none;
    color: inherit;
  }

  button {
    border: none;
    cursor: pointer;
    font-family: inherit;
  }

  input, textarea, select {
    font-family: ${theme.fonts.mono};
    background-color: ${theme.colors.cardBg};
    border: 1px solid ${theme.colors.border};
    color: ${theme.colors.text};
    padding: ${theme.spacing.sm};
    border-radius: ${theme.borderRadius.md};
    transition: all 0.2s ease;
  }

  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.15);
  }

  input::placeholder {
    color: ${theme.colors.textTertiary};
  }

  scrollbar-width: thin;
  scrollbar-color: ${theme.colors.primary} ${theme.colors.darkBg};

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: ${theme.colors.darkBg};
  }

  ::-webkit-scrollbar-thumb {
    background: ${theme.colors.primary};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: ${theme.colors.hover};
  }
`;
