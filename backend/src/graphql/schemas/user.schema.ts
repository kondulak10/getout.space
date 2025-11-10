import { gql } from 'graphql-tag';

export const userSchema = gql`
	type StravaProfile {
		firstname: String!
		lastname: String!
		profile: String
		imghex: String
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
		isPremium: Boolean!
		stravaProfile: StravaProfile!
		tokenExpiresAt: Int!
		tokenIsExpired: Boolean!
		scope: String!
		lastHex: String
		createdAt: Date!
		updatedAt: Date!
	}

	extend type Query {
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
		Get total count of all users (Admin only)
		Requires: Authentication + Admin
		"""
		usersCount: Int!

		"""
		Get user by ID (Admin only, or own profile)
		Requires: Authentication
		"""
		user(id: ID!): User
	}

	extend type Mutation {
		"""
		Delete user by ID (Admin only)
		Requires: Authentication + Admin
		"""
		deleteUser(id: ID!): Boolean!

		"""
		Delete current user's account and all associated data
		Removes all activities and unassigns all hexagons
		Requires: Authentication
		"""
		deleteMyAccount: Boolean!

		"""
		Refresh Strava access token for a user (Admin only)
		Requires: Authentication + Admin
		"""
		refreshUserToken(id: ID!): User!
	}
`;
