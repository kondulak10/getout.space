import { gql } from 'graphql-tag';
import { userSchema } from './user.schema';
import { activitySchema } from './activity.schema';
import { hexagonSchema } from './hexagon.schema';

const baseSchema = gql`
  scalar Date

  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

export const typeDefs = [
  baseSchema,
  userSchema,
  activitySchema,
  hexagonSchema,
];
