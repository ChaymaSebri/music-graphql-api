const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { getUserFromHttpRequest, getUserFromWsContext } = require('../prisma/src/auth');

test('getUserFromHttpRequest returns null without Authorization header', () => {
  process.env.JWT_SECRET = 'test-secret';
  const user = getUserFromHttpRequest({ headers: {} });
  assert.equal(user, null);
});

test('getUserFromHttpRequest returns decoded user for valid Bearer token', () => {
  process.env.JWT_SECRET = 'test-secret';
  const token = jwt.sign({ sub: '42', email: 'user@example.com', role: 'ADMIN' }, process.env.JWT_SECRET);

  const user = getUserFromHttpRequest({
    headers: { authorization: `Bearer ${token}` },
  });

  assert.equal(user.id, '42');
  assert.equal(user.email, 'user@example.com');
  assert.equal(user.role, 'ADMIN');
});

test('getUserFromWsContext supports connectionParams authorization', () => {
  process.env.JWT_SECRET = 'test-secret';
  const token = jwt.sign({ userId: 7, role: 'USER' }, process.env.JWT_SECRET);

  const user = getUserFromWsContext({
    connectionParams: { authorization: `Bearer ${token}` },
  });

  assert.equal(user.id, 7);
  assert.equal(user.role, 'USER');
});

test('returns null when token is invalid', () => {
  process.env.JWT_SECRET = 'test-secret';

  const user = getUserFromHttpRequest({
    headers: { authorization: 'Bearer invalid.token.here' },
  });

  assert.equal(user, null);
});
