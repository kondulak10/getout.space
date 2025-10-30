import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const httpLink = new HttpLink({
  uri: `${backendUrl}/graphql`,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
