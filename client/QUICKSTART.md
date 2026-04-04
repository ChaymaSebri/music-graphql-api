# 🚀 Quick Start: Running the Client

## Prerequisites
- Node.js installed
- GraphQL API running on `http://localhost:4000` (with seed data)
- Valid JWT token credentials for login

## Installation

```bash
cd client
npm install
```

## Development

```bash
npm run dev
```

Open your browser at: **http://localhost:3000**

## Authentication

The app requires **JWT Token-based authentication**. Login with:

**Artist Role:**
- Email: `artist@example.com`
- Password: `artist-password`

**Listener Role:**
- Email: `listener@example.com`
- Password: `listener-password`

Both roles unlock different features and pages.

## Features by Role

### 👁️ LISTENER Role
✅ **Dashboard** - Music statistics  
✅ **Browse Songs** - Click any song to open modal  
✅ **Songs Modal** - Add to playlists or write reviews  
✅ **My Playlists** - Create and manage playlists  
✅ **My Reviews** - View all your song reviews with ratings  
✅ **Artists & Genres** - Browse all artists and genres  

### 🎤 ARTIST Role
✅ **Dashboard** - Music statistics  
✅ **My Songs** - Create and manage your songs  
✅ **My Albums** - Create and manage your albums  
✅ **Browse Content** - View all artists and genres (read-only)  

## Pages Overview

### 📊 Dashboard
- Total count of songs, artists, albums, and genres
- Quick statistics overview

### 🎵 Songs (Listener Mode)
- Browse 20,000+ songs with pagination
- Click any song card to open **Song Detail Modal**
- Modal features:
  - Add to existing playlist
  - Create new playlist and add song
  - Write review with 1-10 rating
- Display metadata: Title, Artist, Genre, Duration, Popularity, Explicit flag

### 🎵 Songs (Artist Mode)
- Read-only view of all songs
- Display title, artist, genre, duration, popularity, explicit status

### 🎤 Artists
- Grid view of all artists
- Show number of songs per artist
- Pagination support

### 🎸 Genres
- Grid view of all music genres
- Show number of songs per genre
- Pagination support

### 📝 My Songs (Artist Only)
- List all your created songs
- **Embedded Add Song Form** - Create new songs inline
- Fields: Title, Duration, Genre, Album (optional)

### 💿 My Albums (Artist Only)
- List all your created albums
- **Embedded Create Album Form** - Create new albums inline
- Fields: Title, Release Year, Artist

### 📚 My Playlists (Listener Only)
- View all your playlists
- Click to expand and see contained songs
- Create new playlists from the Songs page modal

### ⭐ My Reviews (Listener Only)
- All song reviews you've written
- Display review text, rating (1-10), and star visualization
- Shows song name and artist for context

## Styling

All UI features a **Spotify-like dark theme**:
- Background: `#121212` (Almost Black)
- Cards: `#282828` (Dark Gray)
- Text: `#FFFFFF` (White)
- Primary: `#1DB954` (Spotify Green)
- Hover: `#1ed760` (Light Green)
- Secondary: `#BBBBBB` (Light Gray)

See `src/styles/theme.js` to customize colors and spacing.

## Architecture

```
client/
├── src/
│   ├── App.jsx                      # Main app component with router logic
│   ├── main.jsx                     # React entry point
│   ├── context/
│   │   └── AuthContext.jsx          # Authentication state (token, role, email)
│   ├── components/
│   │   ├── Login.jsx                # Login form with JWT token
│   │   ├── Sidebar.jsx              # Navigation sidebar (role-specific)
│   │   ├── UI.jsx                   # Reusable UI components
│   │   └── SongDetailModal.jsx      # Modal for song interactions
│   ├── styles/
│   │   └── theme.js                 # Theme configuration
│   └── main.jsx
├── index.html                       # Vite entry point (no /public)
├── public/                          # Static assets (favicon, images)
├── package.json
├── vite.config.js                   # Vite + GraphQL proxy config
└── README.md
```

## Key Components

**AuthContext.jsx**
- Manages JWT token storage and user login state
- Provides `isAuthenticated`, `token`, `role`, `email`, `login()`, `logout()`

**SongDetailModal.jsx**
- Opens when listener clicks a song card
- Features: Add to playlist, create playlist, write review
- Displays song metadata: title, artist, genre, popularity, explicit flag

**Sidebar.jsx**
- Role-aware navigation menu
- LISTENER: Dashboard, Songs, Artists, Genres, My Playlists, My Reviews
- ARTIST: Dashboard, Songs, My Songs, My Albums, Artists, Genres

## Build for Production

```bash
npm run build
npm run preview
```

## Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev -- --port 3001
```

**API connection error?**
- Ensure GraphQL API is running on port 4000: `npm start` (from root directory)
- Check `vite.config.js` proxy configuration
- Verify `.env` file has `VITE_GRAPHQL_URL=http://localhost:4000/graphql`

**No songs/artists/genres showing?**
- Run database seed: `node prisma/seed-spotify.js` (from root directory)
- Seed will populate 20,000+ songs from Spotify dataset

**Black screen on login?**
- Check browser Console (F12) for errors
- Verify API is responding: `curl http://localhost:4000/graphql`
- Clear browser cache and refresh

**Can't add to playlist / write review?**
- Ensure you're logged in with LISTENER role
- Check that song IDs exist in database

## Development Workflow

1. **Start API server** (in root directory):
   ```bash
   npm start
   ```

2. **Start client dev server** (in client directory):
   ```bash
   npm run dev
   ```

3. **Open browser**:
   ```
   http://localhost:3000
   ```

4. **Login** with test credentials (LISTENER or ARTIST role)

5. **Test features** based on your role

## Environment Variables

Create `.env` in root (if needed):
```env
VITE_GRAPHQL_URL=http://localhost:4000/graphql
```

## Notes

- Token is stored in browser `localStorage`
- User ID extracted from JWT payload
- Playlists and reviews are **user-specific** (one per user)
- Database is PostgreSQL via Prisma ORM

**Slow performance?**
- Check network tab in DevTools
- Ensure database has proper indexes

Enjoy! 🎵✨
