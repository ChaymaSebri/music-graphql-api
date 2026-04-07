const jwt = require('jsonwebtoken');

function getBearerToken(rawAuthorization) {
  if (!rawAuthorization || typeof rawAuthorization !== 'string') return null;
  const [scheme, token] = rawAuthorization.split(' ');
  if (!scheme || !token || scheme.toLowerCase() !== 'bearer') return null;
  return token.trim() || null;
}

function decodeUserFromToken(token) {
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const payload = jwt.verify(token, secret);
    if (!payload || typeof payload !== 'object') return null;

    return {
      id: payload.sub || payload.userId || null,
      email: payload.email || null,
      role: payload.role || 'USER',
      raw: payload,
    };
  } catch {
    return null;
  }
}

function getUserFromHttpRequest(req) {
  const token = getBearerToken(req?.headers?.authorization);
  return decodeUserFromToken(token);
}

function getUserFromWsContext(ctx) {
  const token = getBearerToken(
    ctx?.connectionParams?.authorization || ctx?.connectionParams?.Authorization,
  );
  return decodeUserFromToken(token);
}

function signAuthToken({ sub, email, role }) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }

  return jwt.sign(
    { sub, email, role },
    secret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
  );
}

module.exports = {
  getUserFromHttpRequest,
  getUserFromWsContext,
  signAuthToken,
};
