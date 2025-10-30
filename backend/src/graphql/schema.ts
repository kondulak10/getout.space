import { gql } from 'graphql-tag';

export const typeDefs = gql`
  type StravaProfile {
    firstname: String!
    lastname: String!
    profile: String!
    city: String
    state: String
    country: String
    sex: String
    username: String
  }

  type User {
    id: ID!
    stravaId: Int!
    isAdmin: Boolean!
    stravaProfile: StravaProfile!
    createdAt: String!
    updatedAt: String!
  }

  type Query {
    """
    Get current authenticated user
    Requires: Authentication
    """
    me: User

    """
    Get all users (Admin only)
    Requires: Authentication + Admin
    """
    users: [User!]!

    """
    Get user by ID (Admin only, or own profile)
    Requires: Authentication
    """
    user(id: ID!): User
  }

  type Mutation {
    """
    Delete user by ID (Admin only)
    Requires: Authentication + Admin
    """
    deleteUser(id: ID!): Boolean!
  }
`;
