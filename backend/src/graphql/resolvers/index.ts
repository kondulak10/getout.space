import merge from 'lodash/merge';
import { userResolvers } from './user.resolvers';
import { activityResolvers } from './activity.resolvers';
import { hexagonResolvers } from './hexagon.resolvers';

// Export GraphQL context type for use in other modules
export { GraphQLContext } from './auth.helpers';

// Merge all resolvers into a single object
export const resolvers = merge(
  {},
  userResolvers,
  activityResolvers,
  hexagonResolvers
);
