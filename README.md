# Mini Projet GraphQL - Theme Musique

API GraphQL autour du domaine musique avec les entites suivantes:
- Genre
- Artist
- Album
- Song
- Playlist
- Review

Le projet est construit avec Node.js, Apollo Server, Express, Prisma et PostgreSQL.

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

## 5.1 Queries (lecture)

### Q1. Genres

```graphql
query GetGenres {
  genres {
    id
    name
  }
}
```

### Q2. Artists

```graphql
query GetArtists {
  artists {
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
  songs {
    id
    title
    duration
    trackNumber
    artist { id name }
    album { id title }
    genre { id name }
  }
}
```

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
    reviews { id content score }
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
  addGenre(name: "Afrobeat") {
    id
    name
  }
}
```

### M2. Ajouter un artiste

```graphql
mutation AddArtist {
  addArtist(name: "Test Artist", country: "MA", bio: "Demo artist") {
    id
    name
    country
  }
}
```

### M3. Mettre a jour un artiste

```graphql
mutation UpdateArtist {
  updateArtist(id: "1", name: "Test Artist Updated", country: "FR", bio: "Updated bio") {
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
  addAlbum(title: "Test Album", releaseYear: 2024, artistId: "1", coverUrl: "https://img.test/cover.jpg") {
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
  updateAlbum(id: "1", title: "Test Album Updated", releaseYear: 2025) {
    id
    title
    releaseYear
  }
}
```

### M6. Ajouter une song

```graphql
mutation AddSong {
  addSong(title: "Test Song", duration: 210, albumId: "1", artistId: "1", genreId: "1", trackNumber: 1) {
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
  addSong(title: "Independent Song", duration: 210, artistId: "1", genreId: "1") {
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
  updateSong(id: "1", title: "Test Song Updated", duration: 220) {
    id
    title
    duration
  }
}
```

### M8. Ajouter une playlist

```graphql
mutation AddPlaylist {
  addPlaylist(name: "Phase1 Playlist", description: "Playlist de test") {
    id
    name
    description
  }
}
```

### M9. Ajouter une song a une playlist

```graphql
mutation AddSongToPlaylist {
  addSongToPlaylist(playlistId: "1", songId: "1") {
    id
    name
    songs { id title }
  }
}
```

### M10. Retirer une song d une playlist

```graphql
mutation RemoveSongFromPlaylist {
  removeSongFromPlaylist(playlistId: "1", songId: "1") {
    id
    name
    songs { id title }
  }
}
```

### M11. Ajouter une review

```graphql
mutation AddReview {
  addReview(content: "Tres bon morceau", score: 9, songId: "1") {
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
  deleteReview(id: "1")
}
```

### M13. Supprimer une song

```graphql
mutation DeleteSong {
  deleteSong(id: "1")
}
```

### M14. Supprimer un album

```graphql
mutation DeleteAlbum {
  deleteAlbum(id: "1")
}
```

### M15. Supprimer un artiste

```graphql
mutation DeleteArtist {
  deleteArtist(id: "1")
}
```

### M16. Supprimer un genre

```graphql
mutation DeleteGenre {
  deleteGenre(id: "1")
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
  addArtist(name: "Test Artist", country: "MA", bio: "dup") {
    id
  }
}
```

Attendu: message de type "Artist already exists..." ou "This record already exists".

### V2. Doublon song

```graphql
mutation DuplicateSong {
  addSong(title: "Test Song", duration: 210, albumId: "1", artistId: "1", genreId: "1", trackNumber: 1) {
    id
  }
}
```

Attendu: message de type "Song already exists...".

### V3. Score invalide

```graphql
mutation BadScore {
  addReview(content: "bad", score: 11, songId: "1") {
    id
  }
}
```

Attendu: message indiquant score entre 1 et 10.

### V4. Duration invalide

```graphql
mutation BadDuration {
  addSong(title: "Bad", duration: 0, albumId: "1", artistId: "1", genreId: "1") {
    id
  }
}
```

Attendu: message indiquant duration positive.

### V5. Nom vide

```graphql
mutation EmptyName {
  addArtist(name: "   ") {
    id
  }
}
```

Attendu: message indiquant nom non vide.

### V6. ID de genre inexistant (sur song)

```graphql
mutation GenreNotFound {
  addSong(title: "Ghost Song", duration: 180, artistId: "1", genreId: "999999") {
    id
  }
}
```

Attendu: message `Genre not found for id=...`.

### V7. ID de song inexistant dans review

```graphql
mutation SongNotFoundForReview {
  addReview(content: "test", score: 8, songId: "999999") {
    id
  }
}
```

Attendu: message `Song not found for id=...`.

### V8. releaseYear invalide

```graphql
mutation BadReleaseYear {
  addAlbum(title: "Old Album", releaseYear: 1500, artistId: "1") {
    id
  }
}
```

Attendu: message indiquant releaseYear hors intervalle autorise.

### V9. trackNumber invalide

```graphql
mutation BadTrackNumber {
  addSong(title: "Track Error", duration: 180, albumId: "1", artistId: "1", genreId: "1", trackNumber: 0) {
    id
  }
}
```

Attendu: message indiquant trackNumber positif.

### V10. Suppression de genre reference (conflit FK)

```graphql
mutation DeleteReferencedGenre {
  deleteGenre(id: "1")
}
```

Attendu: echec avec message de type "Cannot delete this record because it is still referenced".

### V11. Suppression d artiste reference (conflit FK)

```graphql
mutation DeleteReferencedArtist {
  deleteArtist(id: "1")
}
```

Attendu: echec tant que des albums/songs references existent.

### V12. Suppression d un element inexistant

```graphql
mutation DeleteMissingReview {
  deleteReview(id: "999999")
}
```

Attendu: message `Review not found for id=...`.

## 5.5 Tests optionnalite album (Phase 2)

Cette section teste la support pour les songs sans album.

### T1. Creer une song SANS album

```graphql
mutation CreateSongNoAlbum {
  addSong(
    title: "Independent Song"
    duration: 180
    artistId: "1"
    genreId: "1"
  ) {
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
  addSong(
    title: "Album Song"
    duration: 220
    albumId: "1"
    artistId: "1"
    genreId: "1"
    trackNumber: 1
  ) {
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
  addSong(
    title: "Last Song in Album"
    duration: 200
    albumId: "1"
    artistId: "1"
    genreId: "1"
  ) {
    id
    title
  }
}
```

3. Supprimer cette song (si c'est la derniere):

```graphql
mutation DeleteLastSongAutoDeletesAlbum {
  deleteSong(id: "SONG_ID")
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
  addSong(
    title: "Orphan Song"
    duration: 190
    artistId: "1"
    genreId: "1"
  ) {
    id
    title
    album { id }
  }
}
```

2. La supprimer:

```graphql
mutation DeleteOrphanSong {
  deleteSong(id: "SONG_ID")
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

## 7. Commandes utiles

```bash
npm start
npm run seed
npm run studio
npx prisma generate
npx prisma migrate deploy
npx prisma migrate reset --force
```
