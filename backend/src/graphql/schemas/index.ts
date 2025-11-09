import { gql } from 'graphql-tag';
import { userSchema } from '@/graphql/schemas/user.schema';
import { activitySchema } from '@/graphql/schemas/activity.schema';
import { hexagonSchema } from '@/graphql/schemas/hexagon.schema';

const baseSchema = gql`
	scalar Date

	type Query {
		_empty: String
	}

	type Mutation {
		_empty: String
	}
`;

export const typeDefs = [baseSchema, userSchema, activitySchema, hexagonSchema];
