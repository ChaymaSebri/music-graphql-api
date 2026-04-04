# 🔐 Security Quick Reference

## Generate JWT for Testing

### Option 1: jwt.io (Online)
1. Go to https://jwt.io
2. Create payload:
   ```json
   {
     "sub": "user-123",
     "email": "artist@example.com",
     "role": "ARTIST",
     "iat": 1706000000
   }
   ```
3. Set Algorithm: **HS256**
4. Secret: Use value from `JWT_SECRET` env var
5. Copy the token

### Option 2: Node.js CLI
```bash
node -e "const jwt = require('jsonwebtoken'); console.log(jwt.sign({sub:'user-123',email:'artist@example.com',role:'ARTIST'},process.env.JWT_SECRET))"
```

### Option 3: Python
```python
import jwt
import json

payload = {
    "sub": "user-123",
    "email": "artist@example.com",
    "role": "ARTIST"
}

token = jwt.encode(payload, "your_jwt_secret", algorithm="HS256")
print(token)
```

---

## Testing with cURL

### 1. Public Query (No Auth)
```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ stats { totalSongs } }"}'
```

### 2. Protected Query with JWT
```bash
TOKEN="your_jwt_token"

curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ songs(take:5) { id title } }"}'
```

### 3. Mutation - Artist Only
```bash
ARTIST_TOKEN="artist_jwt_token"

curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer $ARTIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { 
      addSong(input: { 
        title: \"My Song\",
        duration: 210000,
        artistId: 1,
        genreId: 5
      }) { 
        id 
        title 
      } 
    }"
  }' | jq '.'
```

### 4. With Client Credentials
```bash
curl -X POST http://localhost:4000/graphql \
  -H "X-Client-ID: web_client" \
  -H "X-Client-Secret: web_secret_key_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{"query":"{ genres { id name } }"}'
```

### 5. Both JWT + Client Credentials
```bash
TOKEN="artist_jwt_token"

curl -X POST http://localhost:4000/graphql \
  -H "X-Client-ID: web_client" \
  -H "X-Client-Secret: web_secret_key_abc123xyz789" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { addArtist(input: {name:\"New Artist\"}) { id } }"}'
```

---

## Testing with Postman

### Setup Headers
1. **GET** auth token (see above)
2. Create new **POST** request to `http://localhost:4000/graphql`
3. Add Headers:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   X-Client-ID: web_client
   X-Client-Secret: web_secret_key_abc123xyz789
   Content-Type: application/json
   ```
4. Body (raw, JSON):
   ```json
   {
     "query": "query { songs(take: 5) { id title artist { name } } }"
   }
   ```

---

## Testing with Apollo Client

```javascript
import { ApolloClient, HttpLink, InMemoryCache, ApolloLink } from '@apollo/client'

// Get JWT token (from login, localStorage, etc)
const token = localStorage.getItem('token')

// Create auth link
const authLink = new ApolloLink((operation, forward) => {
  operation.setContext({
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'X-Client-ID': 'web_client',
      'X-Client-Secret': 'web_secret_key_abc123xyz789',
    },
  })
  return forward(operation)
})

// Create HTTP link
const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
})

// Combine
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
})
```

---

## Testing Role-Based Access

### Artist Can Do
✅ addGenre, addArtist, addAlbum, addSong, updateSong, deleteSong, updateAlbum, deleteAlbum, etc.

```graphql
mutation {
  addSong(input: {
    title: "New Track"
    duration: 240000
    artistId: 1
    genreId: 5
  }) {
    id
    title
  }
}
```

### Listener Can Do
✅ Browse songs/artists/albums
✅ Create playlists
✅ Add reviews
✅ Cannot upload songs

```graphql
mutation {
  addReview(input: {
    content: "Amazing song!"
    score: 9
    songId: 123
  }) {
    id
    score
  }
}
```

### Error When Wrong Role
```json
{
  "errors": [{
    "message": "This action requires ARTIST role",
    "extensions": {
      "code": "FORBIDDEN"
    }
  }]
}
```

---

## Testing WebSocket Subscriptions

### Using wscat
```bash
# Install
npm install -g wscat

# Connect with auth
wscat -c ws://localhost:4000/graphql \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Send subscription
{"id":"1","type":"start","payload":{"query":"subscription { songAdded { id title } }"}}

# Should receive events:
{"id":"1","type":"data","payload":{"data":{"songAdded":{"id":"12345","title":"New Song"}}}}
```

### Using grpc-web-devtools
1. Install extension for Chrome
2. Open DevTools
3. Find WebSocket connections to `ws://localhost:4000/graphql`
4. View incoming subscription data

---

## Common Errors and Solutions

### Error: "Authentication required"
**Cause**: No JWT token provided
**Solution**: Add `Authorization: Bearer <YOUR_TOKEN>` header

### Error: "This action requires ARTIST role"
**Cause**: User role is LISTENER, trying artist-only operation
**Solution**: Use token with `"role": "ARTIST"` in payload

### Error: "Invalid client credentials"
**Cause**: Wrong X-Client-Secret or X-Client-ID
**Solution**: Check credentials match valid clients list (client credentials are optional)

### Subscription not working
**Cause**: No auth token in WebSocket connection
**Solution**: Include `authorization` in `connectionParams`

---

## Environment Variables

```bash
# .env file
JWT_SECRET=your_super_secret_key_here_min_32_chars
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=4000
```

---

## Client Credentials Reference

| Client ID | Secret | Type | Use Case |
|-----------|--------|------|----------|
| `web_client` | `web_secret_key_abc123xyz789` | Web | Browser-based app |
| `mobile_app` | `mobile_secret_key_def456uvw012` | Mobile | iOS/Android app |
| `admin_tool` | `admin_secret_key_ghi789rst345` | Tool | Admin dashboard |
| `test_client` | `test_secret_key_jkl012opq678` | Test | Testing suite |

---

## Next Steps

1. ✅ Start API: `npm start`
2. ✅ Generate JWT token
3. ✅ Test with client credentials
4. ✅ Test with role-based mutations
5. ✅ View [SECURITY.md](SECURITY.md) for complete documentation

---

**Questions?** See [SECURITY.md](SECURITY.md) for detailed architecture and implementation.
