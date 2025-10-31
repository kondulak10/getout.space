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

  type CaptureHistoryEntry {
    userId: ID!
    stravaId: Int!
    activityId: ID!
    stravaActivityId: Float!
    capturedAt: String!
    activityType: String!
  }

  type Hexagon {
    id: ID!
    hexagonId: String!
    currentOwnerId: ID!
    currentOwner: User
    currentOwnerStravaId: Int!
    currentActivityId: ID!
    currentActivity: Activity
    currentStravaActivityId: Float!
    captureCount: Int!
    firstCapturedAt: String!
    firstCapturedBy: User
    lastCapturedAt: String!
    activityType: String!
    routeType: String
    captureHistory: [CaptureHistoryEntry!]!
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

    """
    Get all hexagons owned by current user
    Requires: Authentication
    """
    myHexagons(limit: Int, offset: Int): [Hexagon!]!

    """
    Get hexagons owned by a specific user
    Requires: Authentication
    """
    userHexagons(userId: ID!, limit: Int, offset: Int): [Hexagon!]!

    """
    Get a specific hexagon by its H3 hexagon ID
    Requires: Authentication
    """
    hexagon(hexagonId: String!): Hexagon

    """
    Get most contested hexagons (highest capture count)
    Requires: Authentication
    """
    contestedHexagons(limit: Int): [Hexagon!]!

    """
    Get all hexagons (Admin only)
    Requires: Authentication + Admin
    """
    hexagons(limit: Int, offset: Int): [Hexagon!]!
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

    """
    Capture hexagons from an activity's route
    Requires: Authentication
    """
    captureHexagons(
      activityId: ID!
      hexagonIds: [String!]!
      routeType: String
    ): [Hexagon!]!

    """
    Delete hexagon by ID (Admin only)
    Requires: Authentication + Admin
    """
    deleteHexagon(hexagonId: String!): Boolean!
  }
`;
