import { gql } from 'graphql-tag';

export const activitySchema = gql`
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
		startDate: Date!
		startDateLocal: Date!
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
		lastHex: String
		createdAt: Date!
		updatedAt: Date!
	}

	extend type Query {
		"""
		Get all activities for current user
		Requires: Authentication
		"""
		myActivities(limit: Int, offset: Int): [Activity!]!

		"""
		Get activities for a specific user
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
		Get total count of all activities (Admin only)
		Requires: Authentication + Admin
		"""
		activitiesCount: Int!
	}

	extend type Mutation {
		"""
		Delete activity by ID (Admin or activity owner)
		Requires: Authentication
		"""
		deleteActivity(id: ID!): Boolean!
	}
`;
