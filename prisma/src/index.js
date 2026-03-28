require('dotenv').config();
const { ApolloServer }      = require('@apollo/server');
const { expressMiddleware } = require('@as-integrations/express5');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { WebSocketServer }   = require('ws');
const { useServer }         = require('graphql-ws/use/ws');
const express               = require('express');
const http                  = require('http');

const typeDefs      = require('./schema/typeDefs');
const queries       = require('./resolvers/queries');
const mutations     = require('./resolvers/mutations');
const subscriptions = require('./resolvers/subscriptions');

const schema = makeExecutableSchema({
  typeDefs,
  resolvers: {
    Query:        queries,
    Mutation:     mutations,
    Subscription: subscriptions,
  },
});

async function start() {
  const app        = express();
  const httpServer = http.createServer(app);

  const wsServer     = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const serverCleanup = useServer({ schema }, wsServer);

  const server = new ApolloServer({
    schema,
    plugins: [{
      async serverWillStart() {
        return { async drainServer() { await serverCleanup.dispose(); } };
      }
    }],
  });

  await server.start();
  app.use('/graphql', express.json(), expressMiddleware(server));

  const PORT = process.env.PORT || 4000;
  httpServer.listen(PORT, () => {
    console.log(`🎵 GraphQL API  : http://localhost:${PORT}/graphql`);
    console.log(`🔌 Subscriptions: ws://localhost:${PORT}/graphql`);
  });
}

start();