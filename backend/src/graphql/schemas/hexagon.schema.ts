import { gql } from 'graphql-tag';

export const hexagonSchema = gql`
	type CaptureHistoryEntry {
		userId: ID!
		user: UserPublic
		stravaId: Int!
		activityId: ID!
		activity: Activity
		stravaActivityId: Float!
		capturedAt: Date!
		activityType: String!
	}

	type Hexagon {
		id: ID!
		hexagonId: String!
		currentOwnerId: ID!
		currentOwner: UserPublic
		currentOwnerStravaId: Int!
		currentOwnerIsPremium: Boolean
		currentOwnerImghex: String
		currentActivityId: ID!
		currentActivity: Activity
		currentStravaActivityId: Float!
		captureCount: Int!
		firstCapturedAt: Date!
		firstCapturedBy: UserPublic
		lastCapturedAt: Date!
		lastPreviousOwnerId: ID
		activityType: String!
		routeType: String
		captureHistory: [CaptureHistoryEntry!]!
		createdAt: Date!
		updatedAt: Date!
	}

	type LeaderboardEntry {
		user: UserPublic
		hexCount: Int!
	}

	type VersusStats {
		user1StolenFromUser2: Int!
		user2StolenFromUser1: Int!
	}

	"""
	Battle statistics for a user's hexagons (counts only, no hexagon data)
	"""
	type UserBattleStats {
		ogHexagons: Int!
		conqueredHexagons: Int!
		cleanTerritory: Int!
		totalHexagons: Int!
	}

	"""
	Record hexagon data (minimal fields for display)
	"""
	type RecordHexagon {
		hexagonId: String!
		captureCount: Int!
		lastCapturedAt: Date!
	}

	"""
	Record statistics for a user (most contested and longest held hexagons)
	"""
	type UserRecordStats {
		mostContested: RecordHexagon
		longestHeld: RecordHexagon
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
		Get hexagons from all users by parent H3 IDs (optimized viewport query)
		Requires: Authentication
		"""
		hexagonsByParents(parentHexagonIds: [String!]!): [Hexagon!]!

		"""
		Get hexagons from all users by a single parent H3 ID (for individual caching)
		Requires: Authentication
		"""
		hexagonsByParent(parentHexagonId: String!): [Hexagon!]!

		"""
		Get total count of all hexagons (Admin only)
		Requires: Authentication + Admin
		"""
		hexagonsCount: Int!

		"""
		Get hexagons owned by a specific user
		Requires: Authentication
		"""
		userHexagons(userId: ID!, limit: Int, offset: Int): [Hexagon!]!

		"""
		Get hexagons stolen from a user (where user is in captureHistory but not current owner)
		Requires: Authentication
		"""
		hexagonsStolenFromUser(userId: ID!): [Hexagon!]!

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

		"""
		Get regional leaderboard - users with most currently owned hexagons in the region
		Requires: Authentication
		"""
		regionalActiveLeaders(parentHexagonIds: [String!]!, limit: Int): [LeaderboardEntry!]!

		"""
		Get regional OG discoverers - users who first discovered hexagons in the region (even if lost)
		Requires: Authentication
		"""
		regionalOGDiscoverers(parentHexagonIds: [String!]!, limit: Int): [LeaderboardEntry!]!

		"""
		Get versus stats between two users (how many hexes each stole directly from the other)
		Requires: Authentication
		"""
		versusStats(userId1: ID!, userId2: ID!): VersusStats!

		"""
		Get battle statistics for a user (OG discoveries, conquered, clean territory)
		Returns only counts, no hexagon data - optimized for profile page
		Requires: Authentication
		"""
		userBattleStats(userId: ID!): UserBattleStats!

		"""
		Get record statistics for a user (most contested and longest held hexagons)
		Returns minimal hexagon data for display
		Requires: Authentication
		"""
		userRecordStats(userId: ID!): UserRecordStats!
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
