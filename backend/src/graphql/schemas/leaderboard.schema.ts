import { gql } from 'graphql-tag';

export const leaderboardSchema = gql`
	type LeaderboardEntry {
		userId: ID!
		stravaId: Int!
		username: String!
		imghex: String!
		profileImageUrl: String
		hexagonCount: Int!
		activityCount: Int!
		totalDistance: Float!
		rank: Int!
	}

	type LeaderboardCache {
		type: String!
		entries: [LeaderboardEntry!]!
		lastUpdated: Date!
		nextUpdate: Date!
	}

	extend type Query {
		"""
		Get global leaderboard (all users ranked by hexagon count)
		Returns cached results that update hourly
		"""
		globalLeaderboard: [LeaderboardEntry!]!

		"""
		Get full leaderboard cache with metadata
		"""
		leaderboardCache: LeaderboardCache

		"""
		Get current user's rank in global leaderboard
		Returns null if user has no hexagons or is not ranked
		"""
		myGlobalRank: Int
	}
`;
