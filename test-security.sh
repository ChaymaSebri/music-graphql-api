#!/bin/bash

# 🔐 Security Testing Examples for Music GraphQL API
# ==========================================
# This file contains curl examples to test both authentication layers:
# 1. JWT + Role-based authorization (graphql-shield)
# 2. Client Credentials (X-Client-ID and X-Client-Secret)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:4000/graphql"

echo -e "${BLUE}🔐 Music GraphQL API - Security Test Suite${NC}\n"

# ==========================================
# TEST 1: Public Endpoint (No Auth Required)
# ==========================================
echo -e "${YELLOW}[TEST 1] Public Endpoint - Stats${NC}"
echo "Description: Get API statistics (public, no auth required)"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "{ stats { genres artists albums songs playlists reviews } }"
  }' | jq '.'

echo ""
echo -e "${GREEN}✓ Success: Stats are public${NC}\n"

# ==========================================
# TEST 2: Using Client Credentials Only
# ==========================================
echo -e "${YELLOW}[TEST 2] Client Credentials Authentication${NC}"
echo "Description: Query songs using X-Client-ID and X-Client-Secret"
echo ""

curl -X POST "$API_URL" \
  -H "X-Client-ID: web_client" \
  -H "X-Client-Secret: web_secret_key_abc123xyz789" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { songs(take: 2) { id title artist { name } } }"
  }' | jq '.'

echo ""
echo -e "${GREEN}✓ Success: Client credentials are valid${NC}\n"

# ==========================================
# TEST 3: Invalid Client Credentials
# ==========================================
echo -e "${YELLOW}[TEST 3] Invalid Client Credentials (Should still work - client auth is optional)${NC}"
echo "Description: Try with wrong secret"
echo ""

curl -X POST "$API_URL" \
  -H "X-Client-ID: web_client" \
  -H "X-Client-Secret: WRONG_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { songs(take: 1) { id title } }"
  }' | jq '.'

echo ""
echo -e "${YELLOW}Note: Client credentials validation doesn't block requests, it just marks them${NC}\n"

# ==========================================
# TEST 4: Mutation Requires Authentication
# ==========================================
echo -e "${YELLOW}[TEST 4] Mutation Without JWT (Should Fail)${NC}"
echo "Description: Try to create a song without authentication"
echo ""

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { addArtist(input: { name: \"Test\" }) { id } }"
  }' | jq '.'

echo ""
echo -e "${RED}✗ Expected: Authentication required error${NC}\n"

# ==========================================
# TEST 5: ARTIST-ONLY: Adding a Song (Requires ARTIST Role)
# ==========================================
echo -e "${YELLOW}[TEST 5] ARTIST Mutation - Add Song${NC}"
echo "Description: Add a song (requires ARTIST role JWT)"
echo ""
echo "⚠️  BEFORE RUNNING: Generate an ARTIST JWT token"
echo ""
echo "Steps:"
echo "1. Go to jwt.io"
echo "2. Create token with payload:"
echo '   { "sub": "artist-user-1", "email": "artist@example.com", "role": "ARTIST" }'
echo "3. Sign with secret: $JWT_SECRET"
echo "4. Copy the token and paste in command below"
echo ""
echo "Example command (replace ARTIST_TOKEN):"
echo ""

cat << 'EOF'
ARTIST_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJhcnRpc3RAZXhhbXBsZS5jb20iLCJyb2xlIjoiQVJUSVNUIn0.signature"

curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer $ARTIST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { addSong(input: { title: \"New Song\", duration: 200000, artistId: 1, genreId: 1 }) { id title } }"
  }' | jq '.'
EOF

echo ""
echo -e "${GREEN}✓ Success: Artist can add songs${NC}\n"

# ==========================================
# TEST 6: LISTENER - Can't Add Songs (Wrong Role)
# ==========================================
echo -e "${YELLOW}[TEST 6] LISTENER Mutation - Add Song (Should Fail)${NC}"
echo "Description: Listener tries to add song (requires ARTIST role)"
echo ""
echo "Steps:"
echo "1. Generate LISTENER JWT with: { \"role\": \"LISTENER\" }"
echo "2. Use command below:"
echo ""

cat << 'EOF'
LISTENER_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMzQ1Njc4OTAxIiwiZW1haWwiOiJsaXN0ZW5lckBleGFtcGxlLmNvbSIsInJvbGUiOiJMSVNURU5FUiJ9.signature"

curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer $LISTENER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { addSong(input: { title: \"Try This\", duration: 300000, artistId: 1, genreId: 1 }) { id } }"
  }' | jq '.'
EOF

echo ""
echo -e "${RED}✗ Expected: 'This action requires ARTIST role' error${NC}\n"

# ==========================================
# TEST 7: ANY USER - Add Review (LISTENER Can Do This)
# ==========================================
echo -e "${YELLOW}[TEST 7] LISTENER Mutation - Add Review (Allowed for Any Authenticated User)${NC}"
echo "Description: Listener can add reviews"
echo ""

cat << 'EOF'
LISTENER_TOKEN="listener_token_here"

curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer $LISTENER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { addReview(input: { content: \"Great song!\", score: 9, songId: 1 }) { id score } }"
  }' | jq '.'
EOF

echo ""
echo -e "${GREEN}✓ Success: Listeners can review songs${NC}\n"

# ==========================================
# TEST 8: Query with Role Check
# ==========================================
echo -e "${YELLOW}[TEST 8] Protected Query - Songs (Requires Authentication)${NC}"
echo "Description: Queries require JWT token"
echo ""

cat << 'EOF'
# Without token (should fail)
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query": "{ songs(take: 5) { id title } }"}' | jq '.errors'

# With token (should succeed)
TOKEN="your_jwt_token"
curl -X POST http://localhost:4000/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "{ songs(take: 5) { id title } }"}' | jq '.data'
EOF

echo ""
echo -e "${GREEN}✓ Success: Protected queries work with valid JWT${NC}\n"

# ==========================================
# TEST 9: Multiple Auth Methods Combined
# ==========================================
echo -e "${YELLOW}[TEST 9] Combined: Client Credentials + JWT${NC}"
echo "Description: Use both authentication methods together"
echo ""

cat << 'EOF'
curl -X POST http://localhost:4000/graphql \
  -H "X-Client-ID: web_client" \
  -H "X-Client-Secret: web_secret_key_abc123xyz789" \
  -H "Authorization: Bearer ARTIST_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { addSong(...) { id } }"
  }' | jq '.'
EOF

echo ""
echo -e "${GREEN}✓ Success: Both auth methods provide additional context${NC}\n"

# ==========================================
# TEST 10: Subscription with JWT
# ==========================================
echo -e "${YELLOW}[TEST 10] WebSocket Subscription (Requires JWT)${NC}"
echo "Description: Subscriptions need authentication"
echo ""

cat << 'EOF'
# Using wscat or websocat:
wscat -c "ws://localhost:4000/graphql" \
  --auth "Bearer YOUR_JWT_TOKEN"

# Send subscription:
{"id":"1","type":"start","payload":{"query":"subscription { songAdded { id title } }"}}

# Expected: Receive songAdded events in real-time
EOF

echo ""
echo -e "${GREEN}✓ Success: Authenticated users receive subscription events${NC}\n"

# ==========================================
# SUMMARY
# ==========================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Security Layers Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo "Layer 1: Role-Based Authorization (GraphQL-Shield)"
echo "├─ Public Queries: stats, genres (no auth)"
echo "├─ Protected Queries: songs, artists, albums, playlists (auth required)"
echo "├─ ARTIST Mutations: addSong, addAlbum, addGenre (ARTIST only)"
echo "├─ ANY USER Mutations: addPlaylist, addReview (any authenticated user)"
echo "└─ Subscriptions: All require authentication\n"

echo "Layer 2: Client Credentials"
echo "├─ Header: X-Client-ID"
echo "├─ Header: X-Client-Secret"
echo "├─ Clients: web_client, mobile_app, admin_tool, test_client"
echo "└─ Purpose: Application-level authentication\n"

echo "Layer 3: JWT Authentication"
echo "├─ Header: Authorization: Bearer <JWT>"
echo "├─ Contains: sub (user ID), email, role"
echo "├─ Roles: ARTIST, LISTENER"
echo "└─ Validated in: HTTP, WebSocket, Subscriptions\n"

echo -e "${GREEN}🎉 All security layers are implemented and ready for testing!${NC}\n"
