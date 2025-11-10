import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink, Observable, FetchResult } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLError } from 'graphql';
import { OperationDefinitionNode } from 'graphql';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const httpLink = new HttpLink({
  uri: `${backendUrl}/graphql`,
});

const loggingLink = new ApolloLink((operation, forward) => {
  const startTime = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  const firstDefinition = operation.query.definitions[0] as OperationDefinitionNode;
  const operationType = firstDefinition?.operation || 'unknown';

  console.log(
    `%c🚀 GraphQL Request [${timestamp}]`,
    'background: #6B7280; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
    '\n',
    `Operation: ${operation.operationName}`,
    '\n',
    `Type: ${operationType}`,
    '\n',
    `Variables:`, operation.variables,
    '\n',
    `Query:`, operation.query.loc?.source.body
  );

  const observable = forward(operation);

  return new Observable((observer) => {
    const subscription = observable.subscribe({
      next: (response: FetchResult) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const endTimestamp = new Date().toLocaleTimeString();

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
      error: (error: Error) => observer.error(error),
      complete: () => observer.complete(),
    });

    return () => subscription.unsubscribe();
  });
});

const errorLink = onError((errorContext: any) => {
  const timestamp = new Date().toLocaleTimeString();

  if (errorContext.graphQLErrors) {
    errorContext.graphQLErrors.forEach((error: GraphQLError) =>
      console.log(
        `%c❌ GraphQL Error [${timestamp}]`,
        'background: #EF4444; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
        '\n',
        `Operation: ${errorContext.operation?.operationName}`,
        '\n',
        `Message: ${error.message}`,
        '\n',
        `Location:`, error.locations,
        '\n',
        `Path:`, error.path
      )
    );
  }

  if (errorContext.networkError) {
    console.log(
      `%c❌ Network Error [${timestamp}]`,
      'background: #EF4444; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
      '\n',
      `Operation: ${errorContext.operation?.operationName}`,
      '\n',
      `Error:`, errorContext.networkError
    );
  }
});

const authLink = setContext((_, { headers }) => {
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
    errorLink,
    loggingLink,
    authLink,
    httpLink
  ]),
  cache: new InMemoryCache({
    typePolicies: {
      User: {
        keyFields: ['id'],
        fields: {
          stravaProfile: {
            merge: false,
          },
        },
      },
    },
  }),
});
