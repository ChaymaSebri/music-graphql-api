/**
 * Client Credentials Authentication
 * Simple API key / client ID + secret system
 * 
 * Usage:
 *   curl -H "X-Client-ID: mobile_app" \
 *        -H "X-Client-Secret: secret_123" \
 *        http://localhost:4000/graphql
 */

// ============================================
// VALID CLIENT CREDENTIALS DATABASE
// ============================================
// In production: Store in secure database with hashed secrets
const VALID_CLIENTS = {
  // Client ID: Client Secret
  'web_client': 'web_secret_key_abc123xyz789',
  'mobile_app': 'mobile_secret_key_def456uvw012',
  'admin_tool': 'admin_secret_key_ghi789rst345',
  'test_client': 'test_secret_key_jkl012opq678',
}

// ============================================
// CLIENT METADATA
// ============================================
// Extra info about each client
const CLIENT_METADATA = {
  'web_client': {
    name: 'Music Web App',
    maxRequests: 1000,
    scope: ['read', 'write'],
  },
  'mobile_app': {
    name: 'Music Mobile App',
    maxRequests: 500,
    scope: ['read', 'write'],
  },
  'admin_tool': {
    name: 'Admin Dashboard',
    maxRequests: 5000,
    scope: ['read', 'write', 'delete'],
  },
  'test_client': {
    name: 'Test Suite',
    maxRequests: 100,
    scope: ['read'],
  },
}

// ============================================
// VALIDATION FUNCTION
// ============================================

/**
 * Validate client credentials from request headers
 * @param {Object} headers - HTTP headers from request
 * @returns {Object|null} - Client info if valid, null if invalid
 */
export function validateClientCredentials(headers) {
  const clientId = headers['x-client-id'] || headers['x-client-id']?.toLowerCase()
  const clientSecret = headers['x-client-secret']

  // Check if client exists
  if (!clientId || !VALID_CLIENTS[clientId]) {
    return null
  }

  // Check if secret matches
  if (VALID_CLIENTS[clientId] !== clientSecret) {
    return null
  }

  // Return client info
  return {
    clientId,
    metadata: CLIENT_METADATA[clientId] || {},
    authenticated: true,
  }
}

/**
 * Get all registered clients (for admin purposes)
 * @param {string} adminSecret - Admin password to prevent unauthorized access
 * @returns {Array|null} - List of clients if authorized
 */
export function listClients(adminSecret) {
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return null
  }

  return Object.entries(VALID_CLIENTS).map(([clientId, secret]) => ({
    clientId,
    secret: secret.substring(0, 10) + '***', // Masked
    metadata: CLIENT_METADATA[clientId],
  }))
}

/**
 * Register a new client
 * @param {string} clientId - Unique client identifier
 * @param {string} clientSecret - Client secret (store securely in production)
 * @param {string} adminSecret - Admin password
 * @returns {boolean} - Success status
 */
export function registerClient(clientId, clientSecret, adminSecret) {
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return false
  }

  if (VALID_CLIENTS[clientId]) {
    return false // Client already exists
  }

  VALID_CLIENTS[clientId] = clientSecret
  return true
}

/**
 * Revoke client credentials
 * @param {string} clientId - Client to revoke
 * @param {string} adminSecret - Admin password
 * @returns {boolean} - Success status
 */
export function revokeClient(clientId, adminSecret) {
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return false
  }

  delete VALID_CLIENTS[clientId]
  return true
}

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Express middleware to check client credentials
 * Falls back to JWT if no client credentials provided
 */
export function clientCredentialsMiddleware(req, res, next) {
  const clientInfo = validateClientCredentials(req.headers)

  if (clientInfo) {
    // Client credentials valid - add to request
    req.client = clientInfo
    req.clientAuthenticated = true
  }

  // Continue to next middleware (JWT will be checked later)
  next()
}

/**
 * Strict client credentials middleware (no JWT fallback)
 * Use for specific endpoints that require client auth only
 */
export function requireClientCredentials(req, res, next) {
  const clientInfo = validateClientCredentials(req.headers)

  if (!clientInfo) {
    return res.status(401).json({
      error: 'Invalid client credentials',
      message: 'Missing or invalid X-Client-ID and X-Client-Secret headers',
    })
  }

  req.client = clientInfo
  req.clientAuthenticated = true
  next()
}

// ============================================
// HELPER: Generate Example Curl Commands
// ============================================

export function generateCurlExamples() {
  return `
# Example 1: Web Client
curl -X POST http://localhost:4000/graphql \\
  -H "X-Client-ID: web_client" \\
  -H "X-Client-Secret: web_secret_key_abc123xyz789" \\
  -H "Content-Type: application/json" \\
  -d '{"query":"{ songs(take: 5) { id title } }"}'

# Example 2: Mobile App
curl -X POST http://localhost:4000/graphql \\
  -H "X-Client-ID: mobile_app" \\
  -H "X-Client-Secret: mobile_secret_key_def456uvw012" \\
  -H "Content-Type: application/json" \\
  -d '{"query":"{ artists(take: 5) { id name } }"}'

# Example 3: With JWT Token (Combined auth)
curl -X POST http://localhost:4000/graphql \\
  -H "X-Client-ID: web_client" \\
  -H "X-Client-Secret: web_secret_key_abc123xyz789" \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"query":"mutation { addSong(input: {title:\\"Test\\"}) { id } }"}'
`
}
