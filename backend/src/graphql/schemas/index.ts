import { gql } from 'graphql-tag';
import { userSchema } from './user.schema';
import { activitySchema } from './activity.schema';
import { hexagonSchema } from './hexagon.schema';

// Base schema with Query and Mutation types
// Individual schemas will extend these
const baseSchema = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`;

// Combine all schema parts
export const typeDefs = [
  baseSchema,
  userSchema,
  activitySchema,
  hexagonSchema,
];
