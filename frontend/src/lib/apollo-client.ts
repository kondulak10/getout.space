import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const httpLink = new HttpLink({
  uri: `${backendUrl}/graphql`,
});

// Auth link to add JWT token to headers
const authLink = setContext((_, { headers }) => {
  // Get token from localStorage
  const token = localStorage.getItem('getout_auth_token');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});
