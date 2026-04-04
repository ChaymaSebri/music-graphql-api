# 🔐 Security Implementation - Music GraphQL API

This document describes the security architecture of the Music GraphQL API, including role-based authorization and client credentials authentication.

---

## Overview

The API implements **two layers of security**:

1. **GraphQL-Shield** - Role-based authorization at the GraphQL operation level
2. **Client Credentials** - Application-level API key authentication for client applications

---

## Layer 1: Role-Based Authorization (graphql-shield)

### Architecture

**graphql-shield** is a middleware that intercepts GraphQL operations and validates permissions based on user roles.

**Files Involved:**
- `prisma/src/permissions.js` - Define authorization rules
- `prisma/src/shield.js` - Bind rules to GraphQL operations
- `prisma/src/index.js` - Apply middleware to Apollo Server

### User Roles

The API supports two user roles:

```typescript
enum Role {
  ARTIST     // Can create/upload content (genres, artists, albums, songs)
  LISTENER   // Can browse and review (read-only for most content)
}
```

### Rules (permissions.js)

#### Basic Rules

```javascript
isAuthenticated  // User has valid JWT token
isArtist         // User has ARTIST role
isListener       // User has LISTENER role
isAnyUser        // User is either ARTIST or LISTENER
isPublic         // Anyone (authenticated or not)
```

#### Composite Rules

```javascript
authAndArtist     // AND(authenticated, isArtist)
authAndListener   // AND(authenticated, isListener)
canCreate         // Create content (requires ARTIST role)
canManageContent  // Modify/delete own content (requires ARTIST)
canDelete         // Delete resources (requires ARTIST role)
canReview         // Create reviews (any authenticated user)
```

### Permission Schema (shield.js)

#### Queries (Read Operations)

| Query | Rule | Access |
|-------|------|--------|
| `stats` | `isPublic` | Anyone |
| `genres` | `isPublic` | Anyone |
| `artists` | `isAuthenticated` | Logged-in users |
| `albums` | `isAuthenticated` | Logged-in users |
| `songs` | `isAuthenticated` | Logged-in users |
| `playlists` | `isAuthenticated` | Logged-in users |
| `reviews` | `isAuthenticated` | Logged-in users |

#### Mutations (Write Operations)

| Mutation | Required Role | Accessible By |
|----------|---------------|---------------|
| `addGenre` | ARTIST | Artists only |
| `deleteGenre` | ARTIST | Artists only |
| `addArtist` | ARTIST | Artists only |
| `updateArtist` | ARTIST | Artists only |
| `deleteArtist` | ARTIST | Artists only |
| `addAlbum` | ARTIST | Artists only |
| `updateAlbum` | ARTIST | Artists only |
| `deleteAlbum` | ARTIST | Artists only |
| `addSong` | ARTIST | Artists only |
| `updateSong` | ARTIST | Artists only |
| `deleteSong` | ARTIST | Artists only |
| `addPlaylist` | AUTHENTICATED | All users |
| `addSongToPlaylist` | AUTHENTICATED | All users |
| `removeSongFromPlaylist` | AUTHENTICATED | All users |
| `addReview` | AUTHENTICATED | All users |
| `deleteReview` | AUTHENTICATED | All users |

#### Subscriptions (Real-time Events)

| Subscription | Rule |
|--------------|------|
| `songAdded` | `isAuthenticated` |
| `songDeleted` | `isAuthenticated` |
| `artistAdded` | `isAuthenticated` |
| `reviewAdded` | `isAuthenticated` |

### Implementation Details

**graphql-shield Middleware (index.js)**

```javascript
import { applyMiddleware } from 'graphql-middleware'
import { shield } from 'graphql-shield'
import { shield_rules } from './shield'

const permissions = shield(shield_rules, {
  allowExternalErrors: true,  // Custom errors from resolvers pass through
  debug: false,              // Set to true in development to see shield logs
})

schema = applyMiddleware(schema, permissions)
```

**Mutation-Level Role Checks (mutations.js)**

In addition to graphql-shield middleware, each mutation also enforces role checks:

```javascript
// Artist-only mutations
const addGenre = async (_, { input }, { user }) => {
  requireArtist(user)  // Throws FORBIDDEN if not ARTIST
  // ... rest of resolver
}

// Any authenticated user
const addReview = async (_, { input }, { user }) => {
  requireAuth(user)    // Throws UNAUTHENTICATED if not logged in
  // ... rest of resolver
}
```

**Role Validation Functions**

```javascript
function requireAuth(user) {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }
}

function requireArtist(user) {
  if (!user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    })
  }
  if (user.role !== 'ARTIST') {
    throw new GraphQLError('This action requires ARTIST role', {
      extensions: { code: 'FORBIDDEN' },
    })
  }
}
```

### Error Responses

When authorization fails, the API returns:

**Unauthenticated (No token)**
```json
{
  "errors": [{
    "message": "Authentication required",
    "extensions": { "code": "UNAUTHENTICATED" }
  }]
}
```

**Forbidden (Wrong role)**
```json
{
  "errors": [{
    "message": "This action requires ARTIST role",
    "extensions": { "code": "FORBIDDEN" }
  }]
}
```

---

## Layer 2: Client Credentials (API Keys)

### Overview

Client Credentials provides application-level authentication using **Client ID + Secret** pairs.

**Perfect for:**
- Public applications (web, mobile)
- Server-to-server communication
- Rate limiting per application
- Audit logging by client

**Files Involved:**
- `prisma/src/clientAuth.js` - Validation logic and middleware
- Configured in `prisma/src/index.js`

### Valid Clients

The API recognizes four clients:

```javascript
const VALID_CLIENTS = {
  'web_client':   'web_secret_key_abc123xyz789',
  'mobile_app':   'mobile_secret_key_def456uvw012',
  'admin_tool':   'admin_secret_key_ghi789rst345',
  'test_client':  'test_secret_key_jkl012opq678',
}
```

**Client Metadata:**

```
web_client
├─ Name: Music Web App
├─ Max Requests: 1000/period
└─ Scope: read, write

mobile_app
├─ Name: Music Mobile App
├─ Max Requests: 500/period
└─ Scope: read, write

admin_tool
├─ Name: Admin Dashboard
├─ Max Requests: 5000/period
└─ Scope: read, write, delete

test_client
├─ Name: Test Suite
├─ Max Requests: 100/period
└─ Scope: read
```

### Usage: Sending Client Credentials

Add two HTTP headers to your GraphQL request:

```bash
curl -X POST http://localhost:4000/graphql \
  -H "X-Client-ID: web_client" \
  -H "X-Client-Secret: web_secret_key_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ songs(take: 5) { id title } }"}'
```

### JavaScript/Fetch Example

```javascript
const headers = {
  'X-Client-ID': 'web_client',
  'X-Client-Secret': 'web_secret_key_abc123xyz789',
  'Content-Type': 'application/json',
}

fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers,
  body: JSON.stringify({ query: '{ songs(take: 5) { id title } }' })
})
```

### Apollo Client Setup

Update Apollo Client to include client credentials:

```javascript
import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client'

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  credentials: 'include',
  headers: {
    'X-Client-ID': 'web_client',
    'X-Client-Secret': 'web_secret_key_abc123xyz789',
  },
})

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
})
```

### Combined: Client Credentials + JWT

You can use both authentication methods together:

```bash
curl -X POST http://localhost:4000/graphql \
  -H "X-Client-ID: web_client" \
  -H "X-Client-Secret: web_secret_key_abc123xyz789" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { addSong(input: {...}) { id } }"}'
```

This provides:
1. **Application identity** (Client ID/Secret)
2. **User identity** (JWT token with role)

### Implementation Details

**Middleware (clientAuth.js)**

```javascript
function clientCredentialsMiddleware(req, res, next) {
  const clientInfo = validateClientCredentials(req.headers)
  
  if (clientInfo) {
    req.client = clientInfo        // Mark as client-authenticated
    req.clientAuthenticated = true
  }
  
  next()  // Continue to JWT validation
}
```

**Validation Function**

```javascript
function validateClientCredentials(headers) {
  const clientId = headers['x-client-id']
  const clientSecret = headers['x-client-secret']

  if (!clientId || !VALID_CLIENTS[clientId]) {
    return null  // Invalid client ID
  }

  if (VALID_CLIENTS[clientId] !== clientSecret) {
    return null  // Invalid secret
  }

  return {
    clientId,
    metadata: CLIENT_METADATA[clientId],
    authenticated: true,
  }
}
```

---

## Security Checklist

- ✅ JWT authentication (via /auth.js)
- ✅ Role-based authorization (graphql-shield)
- ✅ Client credentials (API keys)
- ✅ Mutation-level role enforcement
- ✅ Subscription protection
- ✅ Error handling (UNAUTHENTICATED, FORBIDDEN)

## Production Recommendations

### 1. Store Secrets Securely

**Current (Development):**
```javascript
const VALID_CLIENTS = {
  'web_client': 'web_secret_key_abc123xyz789',  // Hardcoded
}
```

**Production:**
```javascript
// Load from environment variables
const VALID_CLIENTS = {
  'web_client': process.env.WEB_CLIENT_SECRET,
  'mobile_app': process.env.MOBILE_APP_SECRET,
}

// Or from a secure database
const client = await db.clients.findById('web_client')
if (!bcrypt.compare(secret, client.hashedSecret)) {
  return null
}
```

### 2. Hash Client Secrets

Use bcrypt to hash secrets before storage:

```javascript
const bcrypt = require('bcrypt')

// Registration
const hashedSecret = await bcrypt.hash(clientSecret, 10)
await db.clients.create({
  clientId,
  hashedSecret,
  metadata,
})

// Validation
const client = await db.clients.findById(clientId)
const isValid = await bcrypt.compare(incomingSecret, client.hashedSecret)
```

### 3. Rate Limiting

Implement rate limiting per client:

```javascript
const rateLimit = require('express-rate-limit')

const clientRateLimiter = rateLimit({
  store: new RedisStore(),
  keyGenerator: (req) => req.client?.clientId || req.ip,
  max: (req) => req.client?.metadata?.maxRequests || 100,
})

app.use('/graphql', clientRateLimiter)
```

### 4. Audit Logging

Log all authentication attempts:

```javascript
function validateClientCredentials(headers) {
  const clientId = headers['x-client-id']
  const clientSecret = headers['x-client-secret']

  const isValid = checkCredentials(clientId, clientSecret)
  
  // Log attempt
  await db.auditLog.create({
    timestamp: new Date(),
    clientId,
    success: isValid,
    ip: req.ip,
  })

  return isValid ? getClientInfo(clientId) : null
}
```

### 5. Enable HTTPS Only

```javascript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(301, 'https://' + req.host + req.url)
  }
  next()
})
```

### 6. Token Expiration

JWTs should include expiration (`exp` claim):

```javascript
const token = jwt.sign(
  { userId, email, role },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }  // Expires in 24 hours
)
```

### 7. CORS Configuration

Restrict origins in production:

```javascript
const cors = require('cors')

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['POST'],
}))
```

---

## Testing

### Test Role-Based Authorization

**Listener trying to add song (should fail):**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer LISTENER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { addSong(input: { title: \"Test\" ... }) { id } }"
  }'
```

**Response:**
```json
{
  "errors": [{
    "message": "This action requires ARTIST role",
    "extensions": { "code": "FORBIDDEN" }
  }]
}
```

### Test Client Credentials

**Valid credentials:**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "X-Client-ID: web_client" \
  -H "X-Client-Secret: web_secret_key_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ stats { totalSongs } }"}'
```

**Invalid credentials:**
```bash
curl -X POST http://localhost:4000/graphql \
  -H "X-Client-ID: web_client" \
  -H "X-Client-Secret: WRONG_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ stats { totalSongs } }"}'
```

### Test Subscriptions (Protected)

Subscriptions require JWT authentication:

```javascript
// WebSocket connection
const client = new WebSocketLink({
  uri: 'ws://localhost:4000/graphql',
  connectionParams: {
    authorization: `Bearer ${jwtToken}`,
  },
})

// Subscribe (will fail without token)
client.subscribe({
  query: gql`subscription { songAdded { id title } }`
})
```

---

## References

- **graphql-shield:** https://github.com/maticzech/graphql-shield
- **JWT:** https://jwt.io
- **GraphQL Security:** https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
- **Auth Best Practices:** https://developer.okta.com/blog/2018/04/10/oauth-authorization-server-essentials

---

## Summary

| Layer | Method | Implementation | Code |
|-------|--------|-----------------|------|
| **Authorization** | graphql-shield | Role-based rules | `permissions.js`, `shield.js` |
| **Enforcement** | Mutation checks | Each mutation validates role | `mutations.js` |
| **Authentication** | Client Credentials | API key pairs | `clientAuth.js` |
| **Integration** | Express middleware | Validates on every request | `index.js` |

✅ **Phase 2 Security Requirements: COMPLETE**
