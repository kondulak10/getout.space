import { ApolloClient, InMemoryCache, HttpLink, from, ApolloLink, Observable } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const httpLink = new HttpLink({
  uri: `${backendUrl}/graphql`,
});
const loggingLink = new ApolloLink((operation, forward) => {
  const startTime = Date.now();
  const requestTime = new Date().toLocaleTimeString();

  console.log(
    `%c📤 GraphQL Request [${requestTime}]`,
    'background: #6B7280; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
    '\n',
    `Operation: ${operation.operationName || 'Anonymous'}`,
    '\n',
    'Variables:',
    operation.variables,
    '\n',
    'Query:',
    operation.query.loc?.source.body || ''
  );

  const observable = forward(operation);

  return new Observable(observer => {
    const subscription = observable.subscribe({
      next: (response) => {
        const duration = Date.now() - startTime;
        const responseTime = new Date().toLocaleTimeString();
        const hasErrors = response.errors && response.errors.length > 0;

        if (hasErrors) {
          console.log(
            `%c❌ GraphQL Response [${responseTime}] (${duration}ms)`,
            'background: #EF4444; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
            '\n',
            `Operation: ${operation.operationName || 'Anonymous'}`,
            '\n',
            'Errors:',
            response.errors,
            '\n',
            'Data:',
            response.data
          );
        } else {
          console.log(
            `%c✅ GraphQL Response [${responseTime}] (${duration}ms)`,
            'background: #10B981; color: white; padding: 4px 8px; border-radius: 3px; font-weight: bold',
            '\n',
            `Operation: ${operation.operationName || 'Anonymous'}`,
            '\n',
            'Data:',
            response.data,
            '\n',
            'Extensions:',
            response.extensions
          );
        }

        observer.next(response);
      },
      error: (error) => {
        observer.error(error);
      },
      complete: () => {
        observer.complete();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  });
});
const errorLink = onError((errorResponse) => {
	if ('graphQLErrors' in errorResponse && errorResponse.graphQLErrors) {
		console.error('🚨 GraphQL Errors:', {
			operation: errorResponse.operation.operationName,
			errors: errorResponse.graphQLErrors,
		});
	}
	if ('networkError' in errorResponse && errorResponse.networkError) {
		console.error('🌐 Network Error:', errorResponse.networkError);
	}
	if ('response' in errorResponse && errorResponse.response) {
		console.log('📨 Response:', errorResponse.response);
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
