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
    tokenExpiresAt: Int!
    tokenIsExpired: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type Location {
    lat: Float!
    lng: Float!
  }

  type Activity {
    id: ID!
    stravaActivityId: Float!
    userId: ID!
    user: User
    source: String!
    name: String!
    type: String!
    sportType: String
    description: String
    startDate: String!
    startDateLocal: String!
    timezone: String
    movingTime: Int!
    elapsedTime: Int!
    distance: Float!
    elevationGain: Float!
    averageSpeed: Float!
    startLocation: Location
    endLocation: Location
    summaryPolyline: String
    isManual: Boolean!
    isPrivate: Boolean!
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

    """
    Get all activities for current user
    Requires: Authentication
    """
    myActivities(limit: Int, offset: Int): [Activity!]!

    """
    Get activities for a specific user (Admin only, or own activities)
    Requires: Authentication
    """
    userActivities(userId: ID!, limit: Int, offset: Int): [Activity!]!

    """
    Get single activity by ID
    Requires: Authentication
    """
    activity(id: ID!): Activity

    """
    Get all activities (Admin only)
    Requires: Authentication + Admin
    """
    activities(limit: Int, offset: Int): [Activity!]!
  }

  type Mutation {
    """
    Delete user by ID (Admin only)
    Requires: Authentication + Admin
    """
    deleteUser(id: ID!): Boolean!

    """
    Refresh Strava access token for a user (Admin only)
    Requires: Authentication + Admin
    """
    refreshUserToken(id: ID!): User!

    """
    Delete activity by ID (Admin or activity owner)
    Requires: Authentication
    """
    deleteActivity(id: ID!): Boolean!
  }
`;
