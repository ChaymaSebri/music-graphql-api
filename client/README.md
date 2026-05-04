# Music GraphQL Client

Role-aware React client for the Music GraphQL API. It includes JWT auth, client-credential headers, follow-based realtime notifications, and listener/artist-specific workflows.

## What Is Implemented

- JWT sign in and sign up flow.
- Password visibility toggle on auth forms.
- Role-based navigation and pages for `LISTENER` and `ARTIST`.
- Songs, artists, genres, playlists, reviews, albums, and stats pages.
- Follow and unfollow artist flow.
- Listener filter to show only followed artists.
- Realtime notifications over GraphQL subscriptions:
  - listener: followed artist publishes song/album
  - artist: new review on artist songs
- Notification toast stack with manual dismiss.
- Persistent notification history panel (`localStorage`).
- Active page persistence across refresh (`localStorage`).
- Client-side GraphQL query cache with in-flight request deduplication.

## Tech Stack

- React 18
- Vite 4
- GraphQL over HTTP (`fetch`)
- GraphQL subscriptions over WebSocket (`graphql-ws`)

## Authentication And Security Model

The client sends two auth layers:

1. API client credentials in headers for GraphQL HTTP requests:
   - `X-Client-ID`
   - `X-Client-Secret`
2. User JWT in `Authorization: Bearer <token>` for logged-in operations.

Client credential values come from:

- `VITE_CLIENT_ID` (default: `web_client`)
- `VITE_CLIENT_SECRET` (default: `web_secret_key_abc123xyz789`)

## Pages By Role

### Shared

- Dashboard
- Songs
- Artists
- Genres

### Listener

- My Playlists
- My Reviews
- Song detail modal (add to playlist, write review)
- Follow/unfollow artists
- Followed artists filter in artist list

### Artist

- My Songs
- My Albums
- Sidebar follower count
- Realtime review notifications for own catalog

## Realtime Notification Behavior

- Listener subscriptions are dynamically created for each followed artist.
- Artist subscriptions are created for the current artist ID from JWT (`sub`).
- Recent notifications are stored locally and shown in the history drawer.
- History is capped and can be cleared from UI.

## Caching Behavior

Implemented in `src/graphql/api.js`:

- Query responses are cached for a short TTL (default 20s).
- Identical in-flight query requests are deduplicated.
- Mutations automatically clear the cache.

## Local Persistence

- Active page key: `appActivePage`
- Notification history key: `appNotificationHistory`
- Auth token and user metadata are persisted by auth context.

## Project Structure (Current)

```text
client/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── graphql/
│   │   └── api.js
│   ├── realtime/
│   │   └── subscriptions.js
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── components/
│   │   ├── Login.jsx
│   │   ├── Sidebar.jsx
│   │   └── UI.jsx
│   ├── pages/
│   │   ├── CatalogPages.jsx
│   │   ├── CommunityPages.jsx
│   │   └── ArtistPages.jsx
│   ├── constants/
│   │   └── icons.jsx
│   ├── styles/
│   │   └── theme.js
│   └── utils/
├── package.json
├── vite.config.js
├── QUICKSTART.md
└── README.md
```

## Setup

### Prerequisites

- Node.js 16+
- Backend API running at `http://localhost:4000/graphql`

### Install

```bash
cd client
npm install
```

### Run Dev Server

```bash
npm run dev
```

Default URL: `http://localhost:3000`

### Build

```bash
npm run build
npm run preview
```

## Environment Variables (Optional)

Create `client/.env`:

```bash
VITE_CLIENT_ID=web_client
VITE_CLIENT_SECRET=web_secret_key_abc123xyz789
```

If omitted, defaults from `src/graphql/api.js` are used.

## Main GraphQL Operations Used

- Auth: `login`, `signup`
- Catalog: `songs`, `artists`, `genres`, `stats`
- Follow system: `followArtist`, `unfollowArtist`, `myFollowedArtists`
- Listener: `addPlaylist`, `addSongToPlaylist`, `updatePlaylist`, `deletePlaylist`, `addReview`, `deleteReview`
- Artist: `addSong`, `addAlbum`
- Subscriptions: `artistSongAdded`, `artistAlbumAdded`, `reviewAddedForArtist`

## Troubleshooting

### Login Works But API Requests Fail

- Verify backend is running on port `4000`.
- Verify client credentials match backend expected values.

### No Realtime Notifications

- Verify backend WebSocket endpoint is reachable at `ws://localhost:4000/graphql`.
- Listener notifications require following at least one artist.

### Empty Data

- Ensure DB is seeded and backend Prisma migrations are applied.
- Re-login to refresh JWT claims and context.

### Port Conflict

```bash
npm run dev -- --port 3001
```

## Notes

- This README reflects the current role-based and follow-notification version of the client.
- For full-stack setup and architecture, check the root project README.
