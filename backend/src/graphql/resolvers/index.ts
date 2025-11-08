import merge from 'lodash/merge';
import { userResolvers } from './user.resolvers';
import { activityResolvers } from './activity.resolvers';
import { hexagonResolvers } from './hexagon.resolvers';
import { DateScalar } from '../scalars/date.scalar';

export { GraphQLContext } from './auth.helpers';

const dateResolvers = {
  Date: DateScalar,
};

export const resolvers = merge(
  {},
  dateResolvers,
  userResolvers,
  activityResolvers,
  hexagonResolvers
);
