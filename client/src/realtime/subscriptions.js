import { createClient } from 'graphql-ws';

const GRAPHQL_WS_URL = 'ws://localhost:4000/graphql';

let client = null;

function getClient(token) {
  if (client) {
    return client;
  }

  client = createClient({
    url: GRAPHQL_WS_URL,
    connectionParams: () => ({
      authorization: token ? `Bearer ${token}` : undefined,
    }),
    lazy: true,
    retryAttempts: 5,
  });

  return client;
}

export function subscribeGraphQL({ token, query, variables, next, error }) {
  const graphqlClient = getClient(token);

  return graphqlClient.subscribe(
    {
      query,
      variables,
    },
    {
      next,
      error,
      complete: () => {},
    },
  );
}

export function resetSubscriptionClient() {
  if (client) {
    client.dispose();
    client = null;
  }
}
