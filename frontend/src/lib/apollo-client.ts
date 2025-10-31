import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const httpLink = new HttpLink({
  uri: `${backendUrl}/graphql`,
});

// Logging link for GraphQL requests
const loggingLink = new ApolloLink((operation, forward) => {
  const startTime = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  // Log outgoing request
  console.log(
    `%c🚀 GraphQL Request [${timestamp}]`,
    'background: #6B7280; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
    '\n',
    `Operation: ${operation.operationName}`,
    '\n',
    `Type: ${(operation.query.definitions[0] as any)?.operation || 'unknown'}`,
    '\n',
    `Variables:`, operation.variables,
    '\n',
    `Query:`, operation.query.loc?.source.body
  );

  const observable = forward(operation);

  return new Observable((observer: any) => {
    const subscription = observable.subscribe({
      next: (response: any) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const endTimestamp = new Date().toLocaleTimeString();

        // Log successful response
        console.log(
          `%c✅ GraphQL Response [${endTimestamp}] (${duration}ms)`,
          'background: #10B981; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
          '\n',
          `Operation: ${operation.operationName}`,
          '\n',
          `Data:`, response.data,
          '\n',
          `Extensions:`, response.extensions
        );

        observer.next(response);
      },
      error: (error: any) => observer.error(error),
      complete: () => observer.complete(),
    });

    return () => subscription.unsubscribe();
  });
});

// Error link for GraphQL errors
const errorLink = onError((errorResponse: any) => {
  const timestamp = new Date().toLocaleTimeString();
  const { graphQLErrors, networkError, operation } = errorResponse;

  if (graphQLErrors) {
    graphQLErrors.forEach((error: any) =>
      console.log(
        `%c❌ GraphQL Error [${timestamp}]`,
        'background: #EF4444; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
        '\n',
        `Operation: ${operation?.operationName}`,
        '\n',
        `Message: ${error.message}`,
        '\n',
        `Location:`, error.locations,
        '\n',
        `Path:`, error.path
      )
    );
  }

  if (networkError) {
    console.log(
      `%c❌ Network Error [${timestamp}]`,
      'background: #EF4444; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
      '\n',
      `Operation: ${operation?.operationName}`,
      '\n',
      `Error:`, networkError
    );
  }
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
  link: from([
    errorLink,    // Error logging (first to catch all errors)
    loggingLink,  // Request/response logging
    authLink,     // Add JWT token
    httpLink      // Send to backend
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        // Apollo automatically uses 'id' field for cache normalization
        // This ensures mutations that return User objects automatically
        // update all queries containing that user - no refetching needed!
        keyFields: ['id'],
      },
    },
  }),
});
