import { GraphQLError } from 'graphql';
import { IUser } from '../../models/User';

export interface GraphQLContext {
  user?: IUser;
  userId?: string;
  isAuthenticated: boolean;
}

export function requireAuth(context: GraphQLContext): IUser {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

export function requireAdmin(context: GraphQLContext): IUser {
  const user = requireAuth(context);
  if (!user.isAdmin) {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}
