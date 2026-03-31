# Mini Projet GraphQL - Theme Musique

API GraphQL autour du domaine musique avec les entites suivantes:
- Genre
- Artist
- Album
- Song
- Playlist
- Review

Le projet est construit avec Node.js, Apollo Server, Express, Prisma et PostgreSQL.

**Stack complet**: Node.js, Apollo Server 5, Express 5, Prisma 7 (avec @prisma/adapter-pg pour Neon), PostgreSQL, DataLoader 2, graphql-scalars (DateTime).

## 1. Objectif de la Phase 1

Cette phase valide les fondamentaux GraphQL:
- Schema GraphQL et types
- Queries
- Mutations
- Subscriptions
- Modele de donnees relationnel
- Alimentation de la base avec des donnees reelles (MusicBrainz)

## 2. Ce que couvre ce projet

### 2.1 Modelisation des donnees
- Un genre contient plusieurs songs
- Un artiste possede des albums/songs
- Un album appartient a un artiste et contient des songs
- Une song appartient a un artiste et un genre (album OPTIONNEL)
- Une playlist contient plusieurs songs (many-to-many)
- Une review appartient a une song
- **AUTO-CLEANUP**: Quand la derniere song d'un album est supprimee, l'album est auto-supprime

### 2.2 Validation metier implementee
- Protection contre les doublons:
  - Artist: name
  - Album: title + artistId + releaseYear
  - Song: title + albumId + artistId (albumId peut etre NULL - permettant songs sans album)
- Champs texte obligatoires non vides
- score de review entre 1 et 10
- duration positive
- trackNumber positif si fourni (seul si albumId est fourni)
- Erreurs GraphQL explicites pour conflits/contraintes

### 2.3 Temps reel
Subscriptions disponibles:
- songAdded
- songDeleted
- artistAdded
- reviewAdded(songId)

## 3. Prerequis

- Node.js 18+
- PostgreSQL accessible via DATABASE_URL

## 4. Configuration et commandes a lancer

### 4.1 Installer les dependances

```bash
npm install
```

### 4.2 Configurer l environnement

 `.env`:
- DATABASE_URL
- PORT (optionnel, par defaut 4000)

### 4.3 Synchroniser le schema Prisma

En environnement non interactif (recommande ici):

```bash
npx prisma migrate deploy
npx prisma generate
```

Option migration interactive (si terminal local interactif):

```bash
npx prisma migrate dev --name artist_without_genre
```

Option reset complet (dev uniquement, supprime toutes les donnees):

```bash
npx prisma migrate reset --force
```

### 4.4 Alimenter la base

```bash
npm run seed
```

### 4.5 Demarrer l API

```bash
npm start
```

Endpoints:
- GraphQL HTTP: http://localhost:4000/graphql
- GraphQL WS: ws://localhost:4000/graphql

## 5. Plan de tests complet dans Apollo

Ouvrir Apollo Sandbox sur:
http://localhost:4000/graphql

## 5.0 Types de données spécialisées

### DateTime Scalar

Tous les types d'entités (`Genre`, `Artist`, `Album`, `Song`, `Playlist`, `Review`) exposent maintenant 2 champs temporels:
- **createdAt**: Date/heure de création (ISO 8601)
- **updatedAt**: Date/heure de dernière modification (ISO 8601)

**Format**: Strings ISO 8601 (ex: `"2026-03-30T10:45:23.123Z"`)

**Utilité**:
- Afficher "Créé le..." sur l'interface
- Trier les résultats par date (récemment ajouté, modifié)
- Log d'audit (qui a agi quand?)
- Gestion du cache côté client

### Exemple: Récupérer la date d'une review

```graphql
query ReviewWithDates {
  reviews(songId: "1") {
    id
    content
    score
    createdAt
    updatedAt
    song { id title }
  }
}
```

**Réponse attendue:**
```json
{
  "data": {
    "reviews": [
      {
        "id": "1",
        "content": "Great song!",
        "score": 9,
        "createdAt": "2026-03-30T10:45:23.123Z",
        "updatedAt": "2026-03-30T10:45:23.123Z",
        "song": {
          "id": "1",
          "title": "Bohemian Rhapsody"
        }
      }
    ]
  }
}
```

## 5.1 Queries (lecture)

### Q1. Genres

```graphql
query GetGenres {
  genres {
    id
    name
    createdAt
    updatedAt
  }
}
```

### Q2. Artists

```graphql
query GetArtists {
  artists(take: 20, skip: 0, filter: { name: "queen", country: "uk" }) {
    id
    name
    country
  }
}
```

Exemple sans filtre:

```graphql
query GetArtistsNoFilter {
  artists(take: 20, skip: 0) {
    id
    name
    country
  }
}
```

### Q3. Artist by ID

```graphql
query GetArtistById {
  artist(id: "1") {
    id
    name
    bio
    country
    albums { id title releaseYear }
    songs { id title }
  }
}
```

### Q4. Albums

```graphql
query GetAlbums {
  albums {
    id
    title
    releaseYear
    artist { id name }
    songs { id title }
  }
}
```

### Q5. Album by ID

```graphql
query GetAlbumById {
  album(id: "1") {
    id
    title
    releaseYear
    coverUrl
    artist { id name }
    songs { id title duration }
  }
}
```

### Q6. Songs

```graphql
query GetSongs {
  songs(take: 20, skip: 0, filter: { artistName: "queen", genreId: "1" }) {
    id
    title
    duration
    trackNumber
    artist { id name }
    album { id title }
    genre { id name }
    createdAt
    updatedAt
  }
}
```

Autres filtres possibles pour `songs`:
- `filter: { title: "love" }`
- `filter: { artistId: "2" }`
- Combinaison possible avec `take/skip`

### Q7. Song by ID

```graphql
query GetSongById {
  song(id: "1") {
    id
    title
    duration
    trackNumber
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
  addArtist(input: { name: "Test Artist", country: "MA", bio: "Demo artist" }) {
    id
    name
    country
  }
}
```

### M3. Mettre a jour un artiste

```graphql
mutation UpdateArtist {
  updateArtist(input: { id: "1", name: "Test Artist Updated", country: "FR", bio: "Updated bio" }) {
    id
    name
    country
    bio
  }
}
```

### M4. Ajouter un album

```graphql
mutation AddAlbum {
  addAlbum(input: { title: "Test Album", releaseYear: 2024, artistId: "1", coverUrl: "https://img.test/cover.jpg" }) {
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

### M6. Ajouter une song

```graphql
mutation AddSong {
  addSong(input: { title: "Test Song", duration: 210, albumId: "1", artistId: "1", genreId: "1", trackNumber: 1 }) {
    id
    title
    duration
    trackNumber
    album { id title }
  }
}
```

Variante sans album (optionnel):

```graphql
mutation AddSongWithoutAlbum {
  addSong(input: { title: "Independent Song", duration: 210, artistId: "1", genreId: "1" }) {
    id
    title
    duration
    album
  }
}
```

### M7. Mettre a jour une song

```graphql
mutation UpdateSong {
  updateSong(input: { id: "1", title: "Test Song Updated", duration: 220 }) {
    id
    title
    duration
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
  addSongToPlaylist(input: { playlistId: "1", songId: "1" }) {
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
    artist { id name }
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
  addArtist(input: { name: "Test Artist", country: "MA", bio: "dup" }) {
    id
  }
}
```

Attendu: message de type "Artist already exists..." ou "This record already exists".

### V2. Doublon song

```graphql
mutation DuplicateSong {
  addSong(input: { title: "Test Song", duration: 210, albumId: "1", artistId: "1", genreId: "1", trackNumber: 1 }) {
    id
  }
}
```

Attendu: message de type "Song already exists...".

### V3. Score invalide

```graphql
mutation BadScore {
  addReview(input: { content: "bad", score: 11, songId: "1" }) {
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

### V9. trackNumber invalide

```graphql
mutation BadTrackNumber {
  addSong(input: { title: "Track Error", duration: 180, albumId: "1", artistId: "1", genreId: "1", trackNumber: 0 }) {
    id
  }
}
```

Attendu: message indiquant trackNumber positif.

### V10. Suppression de genre reference (conflit FK)

```graphql
mutation DeleteReferencedGenre {
  deleteGenre(input: { id: "1" })
}
```

Attendu: echec avec message de type "Cannot delete this record because it is still referenced".

### V11. Suppression d artiste reference (conflit FK)

```graphql
mutation DeleteReferencedArtist {
  deleteArtist(input: { id: "1" })
}
```

Attendu: echec tant que des albums/songs references existent.

### V12. Suppression d un element inexistant

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

Attendu: Success. `album: null`.

### T2. Creer une song AVEC album

```graphql
mutation CreateSongWithAlbum {
  addSong(input: {
    title: "Album Song"
    duration: 220
    albumId: "1"
    artistId: "1"
    genreId: "1"
    trackNumber: 1
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
  album(id: "1") {
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
    albumId: "1"
    artistId: "1"
    genreId: "1"
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
  album(id: "1") {
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
3. Appliquer la policy à votre schema exécutable

Avantage:
- Séparation claire entre logique métier et logique d'autorisation
- Politique globale, homogène, maintenable
- Réduction du code répétitif dans les resolvers

## 7. Commandes utiles

```bash
npm start
npm run seed
npm run studio
npx prisma generate
npx prisma migrate deploy
npx prisma migrate reset --force
```
