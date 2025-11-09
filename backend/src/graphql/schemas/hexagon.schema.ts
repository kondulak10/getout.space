import { gql } from 'graphql-tag';

export const hexagonSchema = gql`
	type CaptureHistoryEntry {
		userId: ID!
		stravaId: Int!
		activityId: ID!
		stravaActivityId: Float!
		capturedAt: Date!
		activityType: String!
	}

	type Hexagon {
		id: ID!
		hexagonId: String!
		currentOwnerId: ID!
		currentOwner: User
		currentOwnerStravaId: Int!
		currentOwnerIsPremium: Boolean
		currentOwnerImghex: String
		currentActivityId: ID!
		currentActivity: Activity
		currentStravaActivityId: Float!
		captureCount: Int!
		firstCapturedAt: Date!
		firstCapturedBy: User
		lastCapturedAt: Date!
		activityType: String!
		routeType: String
		captureHistory: [CaptureHistoryEntry!]!
		createdAt: Date!
		updatedAt: Date!
	}

	extend type Query {
		"""
		Get all hexagons owned by current user
		Requires: Authentication
		"""
		myHexagons(limit: Int, offset: Int): [Hexagon!]!

		"""
		Get hexagons owned by current user within a bounding box
		Requires: Authentication
		"""
		myHexagonsInBbox(south: Float!, west: Float!, north: Float!, east: Float!): [Hexagon!]!

		"""
		Get all hexagons from all users within a bounding box
		Requires: Authentication
		"""
		hexagonsInBbox(south: Float!, west: Float!, north: Float!, east: Float!): [Hexagon!]!

		"""
		Get hexagons owned by current user by parent H3 IDs (optimized viewport query)
		Requires: Authentication
		"""
		myHexagonsByParents(parentHexagonIds: [String!]!): [Hexagon!]!

		"""
		Get hexagons from all users by parent H3 IDs (optimized viewport query)
		Requires: Authentication
		"""
		hexagonsByParents(parentHexagonIds: [String!]!): [Hexagon!]!

		"""
		Get total count of hexagons owned by current user
		Requires: Authentication
		"""
		myHexagonsCount: Int!

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
		captureHexagons(activityId: ID!, hexagonIds: [String!]!, routeType: String): [Hexagon!]!

		"""
		Delete hexagon by ID (Admin only)
		Requires: Authentication + Admin
		"""
		deleteHexagon(hexagonId: String!): Boolean!
	}
`;
