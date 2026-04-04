# Music GraphQL Client

A beautiful, role-based Spotify-like dark mode client for the Music GraphQL API with green accents, JWT authentication, and dynamic user features.

## ✨ Key Features

✅ **JWT Token Authentication** - Secure login with role-based access  
✅ **Dark Mode Theme** - Spotify-inspired dark interface (#121212)  
✅ **Role-Based Access** - Different UI for ARTIST vs LISTENER roles  
✅ **Interactive Song Modal** - Click songs to add to playlists or write reviews  
✅ **Playlist Management** - Create and manage personal playlists  
✅ **Review System** - Write and view song reviews with star ratings (1-10)  
✅ **Responsive Design** - Works on desktop and tablet  
✅ **Pagination** - Browse 20,000+ songs efficiently  
✅ **Real-time Data** - Connected to your GraphQL API  
✅ **Green Accent Colors** - Primary green (#1DB954) matching Spotify  

## 🎭 Pages by Role

### LISTENER Role
- **Dashboard** - Statistics overview (songs, artists, albums, genres)
- **Songs** - Browse 20,000+ songs → Click any song to open modal
- **Song Modal** - Add to playlist (existing or create new), write review
- **My Playlists** - View all your playlists with song lists
- **My Reviews** - View all your song reviews with ratings and stars
- **Artists** - View all artists (read-only)
- **Genres** - Explore all music genres (read-only)

### ARTIST Role
- **Dashboard** - Statistics overview
- **My Songs** - Create and manage your songs (embedded form)
- **My Albums** - Create and manage your albums (embedded form)
- **Artists** - View all artists (read-only)
- **Genres** - Explore all genres (read-only)
- **Songs** - Browse all songs (read-only)

## 🔐 Authentication

The client uses **JWT token-based authentication**:

**Test Credentials:**

**LISTENER Account:**
- Email: `listener@example.com`
- Password: `listener-password`

**ARTIST Account:**
- Email: `artist@example.com`
- Password: `artist-password`

Token is stored in browser `localStorage` and includes:
- `id` - User ID (extracted from JWT payload)
- `email` - User email
- `role` - User role (ARTIST or LISTENER)

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+ installed
- GraphQL API running on `http://localhost:4000`
- Database seeded with music data

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The client will run on `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
npm run preview
```

## 📖 How to Use

1. **Start the API** (from root directory):
   ```bash
   npm start
   ```

2. **Seed the database** (if needed):
   ```bash
   node prisma/seed-spotify.js
   ```

3. **Start the client** (from client directory):
   ```bash
   npm run dev
   ```

4. **Open browser** at `http://localhost:3000`

5. **Login** with test credentials above

6. **Explore based on your role:**
   - **Listener**: Click songs to create playlists and write reviews
   - **Artist**: Create songs and albums in "My Songs" and "My Albums" pages

## 🎨 Dark Mode & Theming

All colors are defined in `src/styles/theme.js`:

- **Primary Green**: `#1DB954` (Spotify Green)
- **Hover Green**: `#1ed760` (Light Green)
- **Background**: `#121212` (Almost Black)
- **Cards**: `#282828` (Dark Gray)
- **Text**: `#ffffff` (White)
- **Secondary Text**: `#BBBBBB` (Light Gray)
- **Borders**: `#404040` (Medium Gray)

Easily customize spacing and responsive breakpoints in the same file.

## 🏗️ Project Structure

```
client/
├── src/
│   ├── App.jsx                      # Main app with routing, state, and pages
│   ├── main.jsx                     # React entry point
│   ├── context/
│   │   └── AuthContext.jsx          # Authentication context (token, role, email)
│   ├── components/
│   │   ├── Login.jsx                # Login form with JWT auth
│   │   ├── Sidebar.jsx              # Role-aware navigation sidebar
│   │   ├── UI.jsx                   # Reusable UI components
│   │   └── SongDetailModal.jsx      # Interactive song modal (listeners only)
│   ├── styles/
│   │   └── theme.js                 # Centralized theme config
│   └── main.jsx
├── index.html                       # Vite entry point (root level)
├── public/                          # Static assets (favicon, images)
├── package.json
├── vite.config.js                   # Vite config with GraphQL proxy
├── QUICKSTART.md                    # Quick start guide
└── README.md                        # This file
```

## 🧩 Components Overview

**Login.jsx**
- Takes email and password
- Calls GraphQL mutation to get JWT token
- Stores token in localStorage
- Extracts user role from JWT payload

**AuthContext.jsx**
- Provides: `isAuthenticated`, `token`, `role`, `email`, `login()`, `logout()`
- Persists token in localStorage
- Used throughout the app via `useAuth()` hook

**Sidebar.jsx**
- Role-aware: Shows different menu items for LISTENER vs ARTIST
- Dynamic navigation based on `role` from AuthContext
- Active page highlighting

**SongDetailModal.jsx**
- Opens when listener clicks a song card
- **Playlist Section**: Add to existing playlist or create new
- **Review Section**: Write review with 1-10 slider rating
- Displays song metadata: title, artist, genre, popularity, explicit flag
- Listeners only

**UI Components (UI.jsx)**
- `<Header>` - Page title and subtitle
- `<Card>` - Styled card container
- `<Button>` - Themed button component
- `<SearchInput>` - Search text input

## 📡 GraphQL Queries & Mutations

### Queries
- **GetSongs** - Fetch songs with pagination (20 per page)
- **GetArtists** - Fetch all artists (10 per page)
- **GetGenres** - Fetch all genres with songs field (15 per page)
- **GetStats** - Get statistics (total songs, artists, albums, genres)
- **GetMyPlaylists** - Fetch user's playlists with songs (listeners only)
- **GetMyReviews** - Fetch user's reviews with song and rating (listeners only)

### Mutations
- **Login** - Authenticate and get JWT token
- **AddPlaylist** - Create a new playlist (listeners only)
- **AddSongToPlaylist** - Add song to user's playlist (listeners only)
- **AddReview** - Write a review for a song (listeners only)
- **AddSong** - Create a new song (artists only)
- **AddAlbum** - Create a new album (artists only)

## 🔑 Key Features Explained

### Listener Workflow
1. **Login** with listener credentials
2. **View Songs** on Songs page (20,000+ available)
3. **Click any song** to open SongDetailModal
4. **In modal, choose:**
   - Create new playlist + add song
   - Add song to existing playlist
   - Write review (1-10 rating)
5. **View results** in My Playlists and My Reviews pages

### Artist Workflow
1. **Login** with artist credentials
2. **Go to My Songs** page
3. **Fill embedded form** to create new song (title, duration, genre, album optional)
4. **Go to My Albums** page
5. **Fill embedded form** to create new album (title, release year)

## 🎯 Database

- **Database**: PostgreSQL (Neon cloud)
- **ORM**: Prisma v7.6.0
- **Users**: Each user owns their playlists and reviews
- **Playlists**: User-specific, can contain multiple songs
- **Reviews**: One review per song per user (unique constraint)
- **Songs**: 20,000+ imported from Spotify dataset

## 📝 Notes

✅ **Authentication**: All pages require JWT login  
✅ **Token Storage**: JWT stored in browser localStorage  
✅ **Role-Based UI**: Different pages/features for ARTIST vs LISTENER  
✅ **Pagination**: Efficient data loading with skip/take pagination  
✅ **User-Owned Data**: Playlists and reviews are user-specific  
✅ **Modal Interactions**: Song modal only shows for listeners  
✅ **Embedded Forms**: Add Song/Album forms inline on respective pages  
✅ **Error Handling**: Alerts for validation errors and API failures  

## 🐛 Troubleshooting

**Black screen on load?**
- Check browser Console (F12) for errors
- Verify API is running: `curl http://localhost:4000/graphql`
- Ensure you're logged in with correct credentials

**No data showing?**
- Verify database is seeded: `node prisma/seed-spotify.js`
- Check GraphQL API is connected and running
- Try refreshing the page

**Can't click on songs?**
- You must be logged in as LISTENER role
- Artist role has read-only song view

**Port 3000 in use?**
```bash
npm run dev -- --port 3001
```

## 📚 For More Details

- See `QUICKSTART.md` for quick start guide
- Check `src/styles/theme.js` for all theme colors and spacing
- Review `src/App.jsx` for complete routing and state logic
