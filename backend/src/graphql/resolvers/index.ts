import merge from 'lodash/merge';
import { userResolvers } from '@/graphql/resolvers/user.resolvers';
import { activityResolvers } from '@/graphql/resolvers/activity.resolvers';
import { hexagonResolvers } from '@/graphql/resolvers/hexagon.resolvers';
import { DateScalar } from '@/graphql/scalars/date.scalar';

export { GraphQLContext } from '@/graphql/resolvers/auth.helpers';

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
