# Music GraphQL API - Global Project README

This repository contains a complete music platform with:
- A GraphQL backend (Node.js, Apollo Server, Prisma, PostgreSQL)
- A React client (Vite)
- Authentication, role-based access control, pagination/filter/sort, real-time subscriptions, follow system, and in-app notifications

This README is designed for presentation day: what each feature does, and exactly how it is implemented.

## 1) Project Architecture

Backend:
- Node.js + Express 5 + Apollo Server 5
- GraphQL schema-first (typeDefs + resolvers)
- Prisma 7 + PostgreSQL
- WebSocket subscriptions with graphql-ws

Frontend:
- React 18 + Vite
- Custom GraphQL fetch layer with cache and request deduplication
- Real-time notifications via websocket subscriptions

Main folders:
- prisma/schema.prisma -> database models and constraints
- prisma/src/schema/typeDefs.js -> GraphQL API contract
- prisma/src/resolvers/* -> business logic (queries, mutations, subscriptions, fields)
- prisma/src/index.js -> API bootstrap, middleware, HTTP + WS server
- client/src/graphql/api.js -> frontend queries/mutations and fetch wrapper
- client/src/realtime/subscriptions.js -> frontend websocket client
- client/src/App.jsx -> shell, routing by page state, notification center
- client/src/pages/* -> UI pages by domain

## 2) Domain Model (Data)

Core entities:
- Listener
- Artist
- Genre
- Album
- Song
- Playlist
- Review
- ArtistFollow (listener <-> artist follow relationship)

Where defined:
- prisma/schema.prisma

Important constraints used by business rules:
- Album unique by (title, artistId, releaseYear)
- Song unique by (title, albumId, artistId)
- Playlist unique by (name, listenerId)
- Review unique by (songId, listenerId)
- ArtistFollow composite key (listenerId, artistId)

## 3) Authentication and Security

Two layers are used:

1) Client credentials (application-level)
- Required for GraphQL POST calls
- Headers: X-Client-ID and X-Client-Secret
- Implemented in prisma/src/clientAuth.js
- Enforced in prisma/src/index.js with requireClientCredentials

2) JWT (user-level)
- Used for user identity and role checks
- Login/Signup returns token
- Parsed in prisma/src/auth.js
- Role checks implemented in resolver helpers (requireAuth, requireArtist, requireListener)

Note:
- Introspection/Sandbox loading is allowed so GraphQL docs still open in browser.

## 4) GraphQL Features Implemented

Schema location:
- prisma/src/schema/typeDefs.js

Query features:
- Pagination (take, skip)
- Sorting (field + direction)
- Filtering for songs/artists
- Stats query
- Followed artists query for listeners

Mutation features:
- Auth: login, signup
- CRUD operations for music domain
- Playlist management
- Review management
- Follow/unfollow artist

Subscription features:
- Generic events: songAdded, songDeleted, artistAdded, reviewAdded
- Targeted events:
  - artistSongAdded(artistId)
  - artistAlbumAdded(artistId)
  - reviewAddedForArtist(artistId)

Subscription resolver location:
- prisma/src/resolvers/subscriptions.js

Publish points location:
- prisma/src/resolvers/mutations.js

## 5) Frontend Features Implemented

Global app shell:
- client/src/App.jsx

Implemented UX features:
- Role-aware sidebar and page navigation
- Persistent current page after refresh (localStorage)
- In-app toast notifications (auto-dismiss + manual close)
- Notification history panel
- Notification history persistence (localStorage)

Catalog and browsing:
- client/src/pages/CatalogPages.jsx
- Sort controls in songs/artists/genres pages
- Listener-only "All artists / Followed artists" filter in artists page
- Follow/unfollow buttons on artist cards

Artist experience:
- client/src/pages/ArtistPages.jsx
- Add song / add album forms
- My songs / my albums views
- Artist follower count shown in sidebar badge area

Community experience:
- client/src/pages/CommunityPages.jsx
- Playlist and reviews workflows

## 6) Real-Time Notification System

Backend flow:
1) A mutation triggers an event publish in prisma/src/resolvers/mutations.js
2) Subscription resolver in prisma/src/resolvers/subscriptions.js routes events by channel
3) WS server in prisma/src/index.js serves subscriptions at ws://localhost:4000/graphql

Frontend flow:
1) client/src/realtime/subscriptions.js creates graphql-ws client
2) client/src/App.jsx subscribes according to user role:
   - Listener subscribes to followed artists song/album events
   - Artist subscribes to reviewAddedForArtist for own artist id
3) Notifications are pushed to toast + history state

## 7) Performance Optimizations

Backend:
- DataLoader for relation batching (prisma/src/loaders.js)
- Field resolvers compute counts lazily instead of heavy eager nesting

Frontend:
- Query cache with TTL + in-flight deduplication in client/src/graphql/api.js
- Cache clear on mutations

Result:
- Lower repeated requests when switching tabs/pages
- Faster catalog/community/dashboard behavior

## 8) Why Some Errors Happen (Important for Demo Q&A)

"This record already exists" when adding review:
- Caused by unique constraint @@unique([songId, listenerId])
- Means one listener can submit only one review per song

"Invalid client credentials":
- Missing or wrong X-Client-ID / X-Client-Secret headers on HTTP GraphQL POST

Subscription field not found errors:
- Usually backend server not restarted after schema updates

## 9) Setup and Run

Prerequisites:
- Node.js 18+
- PostgreSQL database

Create .env in project root:
- DATABASE_URL=your_postgres_connection_string
- JWT_SECRET=your_secret
- JWT_EXPIRES_IN=7d (optional)
- PORT=4000 (optional)
- ADMIN_SECRET=optional_admin_secret

Install dependencies:

Backend root:
- npm install

Frontend:
- cd client
- npm install

Prisma sync:
- npx prisma generate
- npx prisma db push

Seed options:
- npm run seed (small demo seed)
- npm run seed-spotify (large dataset)

Run backend:
- npm start

Run frontend:
- cd client
- npm run dev

URLs:
- API HTTP: http://localhost:4000/graphql
- API WS: ws://localhost:4000/graphql
- Client: http://localhost:3000

## 10) Demo Script for Presentation (Suggested)

1) Login as listener and artist in two browser windows
2) Listener opens Artists page and follows one artist
3) Artist adds a song
4) Listener receives "New song" toast and history entry
5) Listener adds a review on artist song
6) Artist receives "New review" toast
7) Show sidebar follower count for artist
8) Refresh page to show persistence:
   - Stays on same page
   - Notification history remains

## 11) Current Limitations / Next Improvements

- Review update flow is not yet explicit (second review for same song fails by unique rule)
- Notification history is localStorage-based (not shared across devices)
- Client secrets are static in source for demo; production should use secure secret management

## 12) Quick File Map (Where to explain code live)

Backend core:
- prisma/src/index.js
- prisma/src/schema/typeDefs.js
- prisma/src/resolvers/queries.js
- prisma/src/resolvers/mutations.js
- prisma/src/resolvers/subscriptions.js
- prisma/src/resolvers/fieldResolvers.js
- prisma/src/clientAuth.js
- prisma/src/auth.js

Frontend core:
- client/src/App.jsx
- client/src/components/Sidebar.jsx
- client/src/pages/CatalogPages.jsx
- client/src/pages/ArtistPages.jsx
- client/src/pages/CommunityPages.jsx
- client/src/graphql/api.js
- client/src/realtime/subscriptions.js

Database:
- prisma/schema.prisma

---

If you want, I can also generate a 2-minute oral pitch script and a 5-minute technical deep-dive script based on this README.
    popularity
    explicit
    artist { id name }
    album { id title }
    genre { id name }
    createdAt
    updatedAt
    reviews {
      id
      content
      score
      createdAt
      updatedAt
    }
  }
}
```

### Q8. Playlists

```graphql
query GetPlaylists {
  playlists {
    id
    name
    description
    createdAt
    updatedAt
    songs { id title }
  }
}
```

### Q9. Playlist by ID

```graphql
query GetPlaylistById {
  playlist(id: "1") {
    id
    name
    description
    createdAt
    updatedAt
    songs {
      id
      title
      artist { name }
    }
  }
}
```

### Q10. Reviews by Song

```graphql
query GetReviewsBySong {
  reviews(songId: "1") {
    id
    content
    score
    song { id title }
  }
}
```

## 5.2 Mutations (ecriture)

Executer idealement dans cet ordre.

### M1. Ajouter un genre

```graphql
mutation AddGenre {
  addGenre(input: { name: "Afrobeat" }) {
    id
    name
  }
}
```

### M2. Ajouter un artiste

```graphql
mutation AddArtist {
  addArtist(input: { name: "Test Artist" }) {
    id
    name
  }
}
```

### M3. Mettre a jour un artiste

```graphql
mutation UpdateArtist {
  updateArtist(input: { id: "1", name: "Test Artist Updated" }) {
    id
    name
  }
}
```

### M4. Ajouter un album

```graphql
mutation AddAlbum {
  addAlbum(input: { title: "Test Album", releaseYear: 2024, artistId: "1" }) {
    id
    title
    releaseYear
    artist { id name }
  }
}
```

### M5. Mettre a jour un album

```graphql
mutation UpdateAlbum {
  updateAlbum(input: { id: "1", title: "Test Album Updated", releaseYear: 2025 }) {
    id
    title
    releaseYear
  }
}
```

### M6. Ajouter une song (Avec album)

```graphql
mutation AddSong {
  addSong(input: { 
    title: "My very New Song", 
    duration: 210000, 
    albumId: "331", 
    artistId: "13717", 
    genreId: "15"
  }) {
    id
    title
    duration
    popularity
    explicit
    album { id title }
    artist { id name }
    genre { id name }
  }
}
```

Variante sans album (Spotify 2024+):

```graphql
mutation AddSongIndependent {
  addSong(input: { 
    title: "Indie Release", 
    duration: 180000, 
    artistId: "500", 
    genreId: "15"
  }) {
    id
    title
    duration
    popularity
    explicit
    artist { id name }
  }
}
```

**Note**: `popularity` (0-100) et `explicit` (true/false) sont remplis depuis le dataset Spotify. Pour ajouts manuels, ils restent null.

### M7. Mettre a jour une song

```graphql
mutation UpdateSong {
  updateSong(input: { id: "1", title: "Updated Title", duration: 220000 }) {
    id
    title
    duration
    popularity
    explicit
  }
}
```

### M8. Ajouter une playlist

```graphql
mutation AddPlaylist {
  addPlaylist(input: { name: "Phase1 Playlist", description: "Playlist de test" }) {
    id
    name
    description
  }
}
```

### M9. Ajouter une song a une playlist

```graphql
mutation AddSongToPlaylist {
  addSongToPlaylist(input: { playlistId: "6", songId: "500" }) {
    id
    name
    songs { id title }
  }
}
```

### M10. Retirer une song d une playlist

```graphql
mutation RemoveSongFromPlaylist {
  removeSongFromPlaylist(input: { playlistId: "1", songId: "1" }) {
    id
    name
    songs { id title }
  }
}
```

### M11. Ajouter une review

```graphql
mutation AddReview {
  addReview(input: { content: "Tres bon morceau", score: 9, songId: "1" }) {
    id
    content
    score
    song { id title }
  }
}
```

### M12. Supprimer une review

```graphql
mutation DeleteReview {
  deleteReview(input: { id: "1" })
}
```

### M13. Supprimer une song

```graphql
mutation DeleteSong {
  deleteSong(input: { id: "1" })
}
```

### M14. Supprimer un album

```graphql
mutation DeleteAlbum {
  deleteAlbum(input: { id: "1" })
}
```

### M15. Supprimer un artiste

```graphql
mutation DeleteArtist {
  deleteArtist(input: { id: "1" })
}
```

### M16. Supprimer un genre

```graphql
mutation DeleteGenre {
  deleteGenre(input: { id: "1" })
}
```

## 5.3 Subscriptions (temps reel)

Utiliser 2 onglets Apollo:
- Onglet A: lancer la subscription
- Onglet B: lancer la mutation declencheuse

### S1. Song ajoutee

```graphql
subscription OnSongAdded {
  songAdded {
    id
    title
    duration
    popularity
    explicit
    artist { id name }
    album { id title }
    genre { id name }
  }
}
```

Declencheur: `addSong`

### S2. Song supprimee

```graphql
subscription OnSongDeleted {
  songDeleted
}
```

Declencheur: `deleteSong`

### S3. Artist ajoute

```graphql
subscription OnArtistAdded {
  artistAdded {
    id
    name
  }
}
```

Declencheur: `addArtist`

### S4. Review ajoutee avec filtre songId

```graphql
subscription OnReviewAdded {
  reviewAdded(songId: "1") {
    id
    content
    score
    song { id title }
  }
}
```

Declencheur: `addReview` sur la meme song

## 5.4 Tests d erreurs (obligatoires)

Pour tous les tests ci-dessous, le resultat attendu est:
- la mutation echoue
- `data` est `null` sur le champ concerne
- `errors[0].extensions.code` vaut generalement `BAD_USER_INPUT`

### V1. Doublon artiste

```graphql
mutation DuplicateArtist {
  addArtist(input: { name: "Test Artist"}) {
    id
  }
}
```

Attendu: message de type "Artist already exists..." ou "This record already exists".

### V2. Doublon song

```graphql
mutation DuplicateSong {
  addSong(input: { title: "Test Song", duration: 210, albumId: "1", artistId: "1", genreId: "1"}) {
    id
  }
}
```

Attendu: message de type "Song already exists...".

### V3. Score invalide

```graphql
mutation BadScore {
  addReview(input: { content: "bad", score: 11, songId: "800" }) {
    id
  }
}
```

Attendu: message indiquant score entre 1 et 10.

### V4. Duration invalide

```graphql
mutation BadDuration {
  addSong(input: { title: "Bad", duration: 0, albumId: "1", artistId: "1", genreId: "1" }) {
    id
  }
}
```

Attendu: message indiquant duration positive.

### V5. Nom vide

```graphql
mutation EmptyName {
  addArtist(input: { name: "   " }) {
    id
  }
}
```

Attendu: message indiquant nom non vide.

### V6. ID de genre inexistant (sur song)

```graphql
mutation GenreNotFound {
  addSong(input: { title: "Ghost Song", duration: 180, artistId: "1", genreId: "999999" }) {
    id
  }
}
```

Attendu: message `Genre not found for id=...`.

### V7. ID de song inexistant dans review

```graphql
mutation SongNotFoundForReview {
  addReview(input: { content: "test", score: 8, songId: "999999" }) {
    id
  }
}
```

Attendu: message `Song not found for id=...`.

### V8. releaseYear invalide

```graphql
mutation BadReleaseYear {
  addAlbum(input: { title: "Old Album", releaseYear: 1500, artistId: "1" }) {
    id
  }
}
```

Attendu: message indiquant releaseYear hors intervalle autorise.

### V9. Suppression de genre reference (conflit FK)

```graphql
mutation DeleteReferencedGenre {
  deleteGenre(input: { id: "1" })
}
```

Attendu: echec avec message de type "Cannot delete this record because it is still referenced".

### V10. Suppression d artiste reference (conflit FK)

```graphql
mutation DeleteReferencedArtist {
  deleteArtist(input: { id: "1" })
}
```

Attendu: echec tant que des albums/songs references existent.

### V11. Suppression d un element inexistant

```graphql
mutation DeleteMissingReview {
  deleteReview(input: { id: "999999" })
}
```

Attendu: message `Review not found for id=...`.

## 5.5 Tests optionnalite album (Phase 2)

Cette section teste la support pour les songs sans album.

### T1. Creer une song SANS album

```graphql
mutation CreateSongNoAlbum {
  addSong(input: {
    title: "Independent Song"
    duration: 180
    artistId: "1"
    genreId: "1"
  }) {
    id
    title
    duration
    artist { id name }
    album { id title }
  }
}
```

### T2. Creer une song AVEC album

```graphql
mutation CreateSongWithAlbum {
  addSong(input: {
    title: "Album Song"
    duration: 220
    albumId: "1"
    artistId: "1"
    genreId: "1"
  }) {
    id
    title
    duration
    album { id title }
    artist { id name }
  }
}
```

Attendu: Success. `album` contient `{ id, title }`.

### T3. Supprimer la derniere song d'un album

1. Verifier combien de songs l'album contient:

```graphql
query CheckAlbum {
  album(id: "25828") {
    id
    title
    songs { id title }
  }
}
```

2. Ajouter une song a cet album (pour tester):

```graphql
mutation AddSongToAlbum {
  addSong(input: {
    title: "Last Song in Album"
    duration: 200
    albumId: "25828"
    artistId: "500"
    genreId: "19"
  }) {
    id
    title
  }
}
```

3. Supprimer cette song (si c'est la derniere):

```graphql
mutation DeleteLastSongAutoDeletesAlbum {
  deleteSong(input: { id: "SONG_ID" })
}
```

4. Verifier que l'album a ete supprime:

```graphql
query CheckAlbumDeleted {
  album(id: "25828") {
    id
    title
  }
}
```

Attendu: Album retourne `null` (supprime automatiquement).

### T4. Supprimer une song sans album

1. Creer une song sans album:

```graphql
mutation CreateOrphanSong {
  addSong(input: {
    title: "Orphan Song"
    duration: 190
    artistId: "1"
    genreId: "1"
  }) {
    id
    title
    album { id }
  }
}
```

2. La supprimer:

```graphql
mutation DeleteOrphanSong {
  deleteSong(input: { id: "SONG_ID" })
}
```

Attendu: Success. Seule la song est supprimee, pas d'effet de bord.

## 6. Criteres de validation finale Phase 1

La Phase 1 est consideree fonctionnelle si:
- Toutes les queries principales retournent des donnees
- Toutes les mutations CRUD fonctionnent
- Les subscriptions recoivent les evenements en temps reel
- Les validations bloquent les cas invalides
- Le seed se termine correctement
- **Songs peuvent exister sans album** (album optionnel)
- **Auto-deletion**: Supprimer la derniere song d'un album supprime aussi l'album

## 6.1 Sécurisation - Phase 2 ✅ COMPLÈTE

**La sécurité de l'API est maintenant implémentée avec deux couches:**

### 🛡️ Couche 1: Autorisation basée sur les rôles (graphql-shield)

- **Fichiers**: `prisma/src/permissions.js`, `prisma/src/shield.js`
- **Fonctionnement**: Middleware GraphQL qui valide les permissions avant d'exécuter les resolvers
- **Rôles**:
  - `ARTIST`: Peut créer/modifier des contenus (songs, albums, genres)
  - `LISTENER`: Peut consulter et créer des avis
- **Mutations protégées par rôle**:
  - ✅ Artists ONLY: `addGenre`, `addSong`, `addAlbum`, `addArtist`
  - ✅ Any User: `addPlaylist`, `addReview`

### 🔑 Couche 2: Client Credentials (Clés API)

- **Fichier**: `prisma/src/clientAuth.js`
- **Fonctionnement**: Validation des headers `X-Client-ID` et `X-Client-Secret` sur chaque requête
- **Clients valides**:
  - `web_client` + `web_secret_key_abc123xyz789`
  - `mobile_app` + `mobile_secret_key_def456uvw012`
  - `admin_tool` + `admin_secret_key_ghi789rst345`
  - `test_client` + `test_secret_key_jkl012opq678`

**📖 Documentation complète**: Voir [SECURITY.md](SECURITY.md)

---

## 6.1 Considérations pour la production

### 6.1.1 Limitation du système de Subscriptions actuel

**État actuel**: Le système de subscriptions utilise un **PubSub en mémoire** (SimplePubSub basé sur EventEmitter).

**Limitation**: Cet approche fonctionne parfaitement en développement local, **mais elle ne fonctionne pas avec la mise à l'échelle horizontale** (multiple serveurs). 

**Pourquoi?**
- Les événements publiés sur le **serveur A** ne sont vus que par les clients connectés au **serveur A**
- Les clients connectés au **serveur B** ne reçoivent pas ces événements
- Chaque serveur a sa propre instance PubSub isolée en mémoire

**Exemple problématique:**
```
Serveur A                           Serveur B
┌─────────────────────┐            ┌─────────────────────┐
│ Client 1 connecté   │            │ Client 3 connecté   │
│ ↓                   │            │ ↓                   │
│ Mutation addSong()  │ ──────────→ │ X Pas d'événement   │
│ Événement émis ✓    │            │   (autre serveur)   │
│                     │            │                     │
│ Client 2 connecté   │            │                     │
│ Reçoit ✓            │            │                     │
└─────────────────────┘            └─────────────────────┘
```

### 6.1.2 Solution pour la production: Redis PubSub

**Recommandation**: Utiliser **graphql-redis-subscriptions** qui centralise les événements via **Redis**.

**Installation:**
```bash
npm install graphql-redis-subscriptions redis
```

**Implémentation (exemple):**
```javascript
// prisma/src/pubsub.js (version production)
const { RedisPubSub } = require('graphql-redis-subscriptions');
const Redis = require('redis');

const client = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
  },
});

const pubsub = new RedisPubSub({
  publisher: client.duplicate(),
  subscriber: client.duplicate(),
});

module.exports = { pubsub };
```

**Avantage de Redis:**
- ✅ **Scalabilité horizontale**: Tous les serveurs reçoivent les événements via Redis
- ✅ **Persistance optionnelle**: Les événements peuvent être persistés
- ✅ **Performance élevée**: Redis est optimisé pour pub/sub haute performance
- ✅ **Compatible avec la configuration actuelle**: Les appels `pubsub.publish()` restent identiques

**Configuration en production:**
```bash
# .env (production)
REDIS_URL=redis://user:password@redis.example.com:6379
DATABASE_URL=postgresql://...
PORT=4000
```

**Déploiement recommandé:**
- Redis en tant que service managé (AWS ElastiCache, Azure Cache for Redis, Heroku Redis, etc.)
- Ou déploiement Redis HA (Replication + Sentinel)

### 6.1.3 Migration progressive

1. **Phase 1 (Actuelle)**: SimplePubSub en mémoire (développement/single-server)
2. **Phase 2 (Production)**: Redis PubSub (horizontal scaling)
3. **Phase 3 (Optionnel)**: Événements persistés (EventStore/Kafka) pour audit complet

### 6.1.4 Performance et observabilité

**Monitoré les subscriptions:**
```bash
# Vérifier les connexions Redis
redis-cli
> PUBSUB CHANNELS          # Canaux actifs
> PUBSUB NUMPAT            # Nombre de patterns
```

**Logs recommandés (à ajouter):**
```javascript
pubsub.subscribe('SONG_ADDED', (message) => {
  console.log(`[PubSub] Événement reçu:`, message);
});
```

**Problèmes courants et solutions:**
| Problème | Cause | Solution |
|----------|-------|----------|
| Événements perdus | Clients déconnectés | Implémenter message queue durable (RabbitMQ/Kafka) |
| Latence élevée | Réseau Redis lent | Placer Redis près des serveurs applicatifs |
| Mémoire Redis saturée | Trop d'événements | Configurer LRU éviction policy ou archiver les anciens |

## 6.2 Sécurisation (préparation Phase 2)

### 6.2.1 Contexte GraphQL enrichi avec l'utilisateur

Le serveur injecte désormais `user` dans le contexte GraphQL pour:
- les requêtes HTTP
- les subscriptions WebSocket

Source implémentée:
- `prisma/src/auth.js`: extraction `Bearer` + vérification JWT
- `prisma/src/index.js`: injection de `user` dans `context`

Variables d'environnement:

```bash
JWT_SECRET=your_super_secret_key
```

Comportement:
- Si token valide: `context.user` contient `id`, `email`, `role`
- Si token absent/invalide: `context.user = null`

Exemple HTTP:

```http
Authorization: Bearer <JWT_TOKEN>
```

Exemple WebSocket (`connectionParams`):

```json
{
  "authorization": "Bearer <JWT_TOKEN>"
}
```

Exemple d'usage dans un resolver:

```javascript
function requireAuth(user) {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

// resolver
myPrivateQuery: async (_, __, { user }) => {
  requireAuth(user);
  return { ok: true };
}
```

### 6.2.2 Permissions avec graphql-shield

Pour structurer les permissions au-dessus des resolvers, `graphql-shield` est recommandé.

Installation:

```bash
npm install graphql-shield graphql-middleware
```

Approche cible Phase 2:
1. Définir des règles (`isAuthenticated`, `isAdmin`, etc.)
2. Mapper les règles sur `Query`, `Mutation`, `Subscription`
### 6.2.2 Permissions avec graphql-shield

**✅ IMPLÉMENTÉ** - Voir [SECURITY.md](SECURITY.md) pour les détails complets.

Approche Phase 2:
1. ✅ Règles définies (`isAuthenticated`, `isArtist`, etc.)
2. ✅ Règles mappées sur `Query`, `Mutation`, `Subscription`
3. ✅ Policy appliquée au schema exécutable

**Avantage:**
- Séparation claire entre logique métier et logique d'autorisation
- Politique globale, homogène, maintenable
- Réduction du code répétitif dans les resolvers

---

## 7. Résumé des phases complètes

| Phase | Objectif | État | Notes |
|-------|----------|------|-------|
| **Phase 1** | GraphQL fondamentaux (queries, mutations, subscriptions) | ✅ COMPLET | 30/30 opérations, validation, dataset 34k songs |
| **Phase 2** | Sécurisation (auth, roles, client credentials) | ✅ COMPLET | graphql-shield + client credentials implémentés |
| **Client** | Application React avec rôles | ✅ COMPLET | Dual-role system, Apollo intégration |
| **Documentation** | README, SECURITY, guides | ✅ COMPLET | 3 fichiers README + SECURITY.md |

---

## 8. Commandes utiles

```bash
npm start
npm run seed
npm run studio
npx prisma generate
npx prisma migrate deploy
npx prisma migrate reset --force
```


## 7.1 Scénarios de test par rôle

### Listener Scenario
- Browse music (Q6, Q7)
- Create playlist (M8)
- Add review (M11)

### Artist Scenario
- Create song (M6)
- Edit album (M5)
- View own songs