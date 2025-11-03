import merge from 'lodash/merge';
import { userResolvers } from './user.resolvers';
import { activityResolvers } from './activity.resolvers';
import { hexagonResolvers } from './hexagon.resolvers';
import { DateScalar } from '../scalars/date.scalar';

// Export GraphQL context type for use in other modules
export { GraphQLContext } from './auth.helpers';

// Date scalar resolver
const dateResolvers = {
  Date: DateScalar,
};

// Merge all resolvers into a single object
export const resolvers = merge(
  {},
  dateResolvers,
  userResolvers,
  activityResolvers,
  hexagonResolvers
);
