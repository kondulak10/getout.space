import { GraphQLError } from 'graphql';
import { IUser } from '../../models/User';

// GraphQL Context type
export interface GraphQLContext {
  user?: IUser;
  userId?: string;
  isAuthenticated: boolean;
}

// Helper to check if user is authenticated
export function requireAuth(context: GraphQLContext): IUser {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

// Helper to check if user is admin
export function requireAdmin(context: GraphQLContext): IUser {
  const user = requireAuth(context);
  if (!user.isAdmin) {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}
