import { gql } from 'graphql-tag';

export const hexagonSchema = gql`
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

  extend type Query {
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

  extend type Mutation {
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
