const test = require('node:test');
const assert = require('node:assert/strict');
const { graphql } = require('graphql');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { GraphQLDateTime } = require('graphql-scalars');

const typeDefs = require('../prisma/src/schema/typeDefs');
const queries = require('../prisma/src/resolvers/queries');
const mutations = require('../prisma/src/resolvers/mutations');
const subscriptions = require('../prisma/src/resolvers/subscriptions');
const fieldResolvers = require('../prisma/src/resolvers/fieldResolvers');
const { prisma } = require('../prisma/src/db');

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    DateTime: GraphQLDateTime,
    Query: queries,
    Mutation: mutations,
    Subscription: subscriptions,
    ...fieldResolvers,
  },
});

function firstError(result) {
  return result.errors && result.errors[0];
}

test('artist(id) rejects non-numeric ID with BAD_USER_INPUT', async () => {
  const result = await graphql({
    schema,
    source: 'query { artist(id: "abc") { id } }',
  });

  const error = firstError(result);
  assert.ok(error);
  assert.equal(error.extensions.code, 'BAD_USER_INPUT');
  assert.match(error.message, /id must be a positive integer/i);
});

test('song(id) rejects zero ID with BAD_USER_INPUT', async () => {
  const result = await graphql({
    schema,
    source: 'query { song(id: "0") { id } }',
  });

  const error = firstError(result);
  assert.ok(error);
  assert.equal(error.extensions.code, 'BAD_USER_INPUT');
  assert.match(error.message, /id must be a positive integer/i);
});

test('songs list rejects invalid take', async () => {
  const result = await graphql({
    schema,
    source: 'query { songs(take: 0, skip: 0) { id } }',
  });

  const error = firstError(result);
  assert.ok(error);
  assert.equal(error.extensions.code, 'BAD_USER_INPUT');
  assert.match(error.message, /take must be a positive integer/i);
});

test('reviews list rejects invalid songId', async () => {
  const result = await graphql({
    schema,
    source: 'query { reviews(songId: "bad", take: 10, skip: 0) { id } }',
  });

  const error = firstError(result);
  assert.ok(error);
  assert.equal(error.extensions.code, 'BAD_USER_INPUT');
  assert.match(error.message, /songid must be a positive integer/i);
});

test('addReview rejects non-numeric songId with BAD_USER_INPUT', async () => {
  const result = await graphql({
    schema,
    source: 'mutation { addReview(input: { content: "x", score: 5, songId: "bad" }) { id } }',
    contextValue: { user: { id: '1', role: 'USER' } },
  });

  const error = firstError(result);
  assert.ok(error);
  assert.equal(error.extensions.code, 'BAD_USER_INPUT');
  assert.match(error.message, /songid must be a positive integer/i);
});

test('mutations reject unauthenticated requests with UNAUTHENTICATED', async () => {
  const result = await graphql({
    schema,
    source: 'mutation { addGenre(input: { name: "Test Genre" }) { id } }',
  });

  const error = firstError(result);
  assert.ok(error);
  assert.equal(error.extensions.code, 'UNAUTHENTICATED');
});

test('songs query uses stable orderBy for deterministic pagination', async () => {
  const originalFindMany = prisma.song.findMany;
  let capturedArgs;

  prisma.song.findMany = async (args) => {
    capturedArgs = args;
    return [];
  };

  try {
    await queries.songs(null, { take: 10, skip: 0 });
    assert.deepEqual(capturedArgs.orderBy, [{ createdAt: 'desc' }, { id: 'desc' }]);
  } finally {
    prisma.song.findMany = originalFindMany;
  }
});

test('nested paginated relations use stable orderBy', async () => {
  const originalFindMany = prisma.song.findMany;
  let capturedArgs;

  prisma.song.findMany = async (args) => {
    capturedArgs = args;
    return [];
  };

  try {
    await fieldResolvers.Album.songs({ id: 1 }, { take: 5, skip: 0 }, { loaders: {} });
    assert.deepEqual(capturedArgs.orderBy, [{ createdAt: 'desc' }, { id: 'desc' }]);
  } finally {
    prisma.song.findMany = originalFindMany;
  }
});
