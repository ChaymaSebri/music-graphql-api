require('dotenv').config();
const { ApolloServer }      = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer }   = require('ws');
const { useServer }         = require('graphql-ws/use/ws');
const { GraphQLDateTime }   = require('graphql-scalars');
const express               = require('express');
const http                  = require('http');

const typeDefs      = require('./schema/typeDefs');
const queries       = require('./resolvers/queries');
const mutations     = require('./resolvers/mutations');
const subscriptions = require('./resolvers/subscriptions');
const fieldResolvers = require('./resolvers/fieldResolvers');
const { createLoaders } = require('./loaders');
const { getUserFromHttpRequest, getUserFromWsContext } = require('./auth');

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    DateTime:    GraphQLDateTime,
    Query:       queries,
    Mutation:    mutations,
    Subscription: subscriptions,
    ...fieldResolvers,
  },
});

async function start() {
  const app        = express();
  const httpServer = http.createServer(app);

  const wsServer      = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const serverCleanup = useServer({
    schema,
    context: async (ctx) => ({
      loaders: createLoaders(),
      user: getUserFromWsContext(ctx),
    }),
  }, wsServer);

  const server = new ApolloServer({
    schema,
    plugins: [{
      async serverWillStart() {
        return { async drainServer() { await serverCleanup.dispose(); } };
      }
    }],
  });

  await server.start();
  app.use('/graphql', express.json(), expressMiddleware(server, {
    context: async ({ req }) => ({
      loaders: createLoaders(),
      user: getUserFromHttpRequest(req),
    }),
  }));

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🎵 GraphQL API  : http://localhost:${PORT}/graphql`);
    console.log(`🔌 Subscriptions: ws://localhost:${PORT}/graphql`);
  });
}

start();