import { GraphQLError } from 'graphql';
import { User, IUser } from '../models/User';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';

// GraphQL Context type
export interface GraphQLContext {
  user?: IUser;
  userId?: string;
  isAuthenticated: boolean;
}

// Helper to check if user is authenticated
function requireAuth(context: GraphQLContext): IUser {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

// Helper to check if user is admin
function requireAdmin(context: GraphQLContext): IUser {
  const user = requireAuth(context);
  if (!user.isAdmin) {
    throw new GraphQLError('Admin access required', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}

export const resolvers = {
  Query: {
    // Get current authenticated user
    me: async (_: any, __: any, context: GraphQLContext) => {
      const user = requireAuth(context);
      return user;
    },

    // Get all users (Admin only)
    users: async (_: any, __: any, context: GraphQLContext) => {
      requireAdmin(context);

      try {
        const users = await User.find().sort({ createdAt: -1 });
        return users;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw new GraphQLError('Failed to fetch users');
      }
    },

    // Get user by ID (Admin or own profile)
    user: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      const currentUser = requireAuth(context);

      // Allow if admin or requesting own profile
      if (!currentUser.isAdmin && String(currentUser._id) !== id) {
        throw new GraphQLError('You can only view your own profile', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      try {
        const user = await User.findById(id);
        if (!user) {
          throw new GraphQLError('User not found', {
            extensions: { code: 'NOT_FOUND' },
          });
        }
        return user;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new GraphQLError('Failed to fetch user');
      }
    },
  },

  Mutation: {
    // Delete user by ID (Admin only)
    deleteUser: async (_: any, { id }: { id: string }, context: GraphQLContext) => {
      requireAdmin(context);

      try {
        const result = await User.findByIdAndDelete(id);
        return result !== null;
      } catch (error) {
        console.error('Error deleting user:', error);
        return false;
      }
    },
  },
};
