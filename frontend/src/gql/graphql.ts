import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: unknown; output: unknown; }
};

export type Activity = {
  __typename: 'Activity';
  averageSpeed: Scalars['Float']['output'];
  createdAt: Scalars['Date']['output'];
  description: Maybe<Scalars['String']['output']>;
  distance: Scalars['Float']['output'];
  elapsedTime: Scalars['Int']['output'];
  elevationGain: Scalars['Float']['output'];
  endLocation: Maybe<Location>;
  id: Scalars['ID']['output'];
  isManual: Scalars['Boolean']['output'];
  isPrivate: Scalars['Boolean']['output'];
  lastHex: Maybe<Scalars['String']['output']>;
  movingTime: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  source: Scalars['String']['output'];
  sportType: Maybe<Scalars['String']['output']>;
  startDate: Scalars['Date']['output'];
  startDateLocal: Scalars['Date']['output'];
  startLocation: Maybe<Location>;
  stravaActivityId: Scalars['Float']['output'];
  summaryPolyline: Maybe<Scalars['String']['output']>;
  timezone: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  user: Maybe<User>;
  userId: Scalars['ID']['output'];
};

export type CaptureHistoryEntry = {
  __typename: 'CaptureHistoryEntry';
  activity: Maybe<Activity>;
  activityId: Scalars['ID']['output'];
  activityType: Scalars['String']['output'];
  capturedAt: Scalars['Date']['output'];
  stravaActivityId: Scalars['Float']['output'];
  stravaId: Scalars['Int']['output'];
  user: Maybe<User>;
  userId: Scalars['ID']['output'];
};

export type Hexagon = {
  __typename: 'Hexagon';
  activityType: Scalars['String']['output'];
  captureCount: Scalars['Int']['output'];
  captureHistory: Array<CaptureHistoryEntry>;
  createdAt: Scalars['Date']['output'];
  currentActivity: Maybe<Activity>;
  currentActivityId: Scalars['ID']['output'];
  currentOwner: Maybe<User>;
  currentOwnerId: Scalars['ID']['output'];
  currentOwnerImghex: Maybe<Scalars['String']['output']>;
  currentOwnerIsPremium: Maybe<Scalars['Boolean']['output']>;
  currentOwnerStravaId: Scalars['Int']['output'];
  currentStravaActivityId: Scalars['Float']['output'];
  firstCapturedAt: Scalars['Date']['output'];
  firstCapturedBy: Maybe<User>;
  hexagonId: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastCapturedAt: Scalars['Date']['output'];
  lastPreviousOwnerId: Maybe<Scalars['ID']['output']>;
  routeType: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Date']['output'];
};

export type LeaderboardEntry = {
  __typename: 'LeaderboardEntry';
  hexCount: Scalars['Int']['output'];
  user: Maybe<User>;
};

export type Location = {
  __typename: 'Location';
  lat: Scalars['Float']['output'];
  lng: Scalars['Float']['output'];
};

export type Mutation = {
  __typename: 'Mutation';
  _empty: Maybe<Scalars['String']['output']>;
  /**
   * Capture hexagons from an activity's route
   * Requires: Authentication
   */
  captureHexagons: Array<Hexagon>;
  /**
   * Delete activity by ID (Admin or activity owner)
   * Requires: Authentication
   */
  deleteActivity: Scalars['Boolean']['output'];
  /**
   * Delete hexagon by ID (Admin only)
   * Requires: Authentication + Admin
   */
  deleteHexagon: Scalars['Boolean']['output'];
  /**
   * Delete current user's account and all associated data
   * Removes all activities and unassigns all hexagons
   * Requires: Authentication
   */
  deleteMyAccount: Scalars['Boolean']['output'];
  deleteNotification: Scalars['Boolean']['output'];
  /**
   * Delete user by ID (Admin only)
   * Requires: Authentication + Admin
   */
  deleteUser: Scalars['Boolean']['output'];
  markAllNotificationsAsRead: Scalars['Int']['output'];
  markNotificationAsRead: Notification;
  /**
   * Refresh Strava access token for a user (Admin only)
   * Requires: Authentication + Admin
   */
  refreshUserToken: User;
};


export type MutationCaptureHexagonsArgs = {
  activityId: Scalars['ID']['input'];
  hexagonIds: Array<Scalars['String']['input']>;
  routeType?: InputMaybe<Scalars['String']['input']>;
};


export type MutationDeleteActivityArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteHexagonArgs = {
  hexagonId: Scalars['String']['input'];
};


export type MutationDeleteNotificationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationMarkNotificationAsReadArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRefreshUserTokenArgs = {
  id: Scalars['ID']['input'];
};

export type Notification = {
  __typename: 'Notification';
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  message: Scalars['String']['output'];
  read: Scalars['Boolean']['output'];
  relatedActivityId: Maybe<Scalars['ID']['output']>;
  type: NotificationType;
};

export enum NotificationType {
  Negative = 'negative',
  Neutral = 'neutral',
  Positive = 'positive'
}

export type Query = {
  __typename: 'Query';
  _empty: Maybe<Scalars['String']['output']>;
  /**
   * Get all activities (Admin only)
   * Requires: Authentication + Admin
   */
  activities: Array<Activity>;
  /**
   * Get total count of all activities (Admin only)
   * Requires: Authentication + Admin
   */
  activitiesCount: Scalars['Int']['output'];
  /**
   * Get single activity by ID
   * Requires: Authentication
   */
  activity: Maybe<Activity>;
  /**
   * Get most contested hexagons (highest capture count)
   * Requires: Authentication
   */
  contestedHexagons: Array<Hexagon>;
  /**
   * Get a specific hexagon by its H3 hexagon ID
   * Requires: Authentication
   */
  hexagon: Maybe<Hexagon>;
  /**
   * Get all hexagons (Admin only)
   * Requires: Authentication + Admin
   */
  hexagons: Array<Hexagon>;
  /**
   * Get hexagons from all users by a single parent H3 ID (for individual caching)
   * Requires: Authentication
   */
  hexagonsByParent: Array<Hexagon>;
  /**
   * Get hexagons from all users by parent H3 IDs (optimized viewport query)
   * Requires: Authentication
   */
  hexagonsByParents: Array<Hexagon>;
  /**
   * Get total count of all hexagons (Admin only)
   * Requires: Authentication + Admin
   */
  hexagonsCount: Scalars['Int']['output'];
  /**
   * Get all hexagons from all users within a bounding box
   * Requires: Authentication
   */
  hexagonsInBbox: Array<Hexagon>;
  /**
   * Get hexagons stolen from a user (where user is in captureHistory but not current owner)
   * Requires: Authentication
   */
  hexagonsStolenFromUser: Array<Hexagon>;
  /**
   * Get current authenticated user
   * Requires: Authentication
   */
  me: Maybe<User>;
  /**
   * Get all activities for current user
   * Requires: Authentication
   */
  myActivities: Array<Activity>;
  /**
   * Get all hexagons owned by current user
   * Requires: Authentication
   */
  myHexagons: Array<Hexagon>;
  /**
   * Get hexagons owned by current user within a bounding box
   * Requires: Authentication
   */
  myHexagonsInBbox: Array<Hexagon>;
  myNotifications: Array<Notification>;
  myUnreadNotificationCount: Scalars['Int']['output'];
  notifications: Array<Notification>;
  notificationsCount: Scalars['Int']['output'];
  /**
   * Get regional leaderboard - users with most currently owned hexagons in the region
   * Requires: Authentication
   */
  regionalActiveLeaders: Array<LeaderboardEntry>;
  /**
   * Get regional OG discoverers - users who first discovered hexagons in the region (even if lost)
   * Requires: Authentication
   */
  regionalOGDiscoverers: Array<LeaderboardEntry>;
  /**
   * Get user by ID
   * Requires: Authentication
   */
  user: Maybe<User>;
  /**
   * Get activities for a specific user
   * Requires: Authentication
   */
  userActivities: Array<Activity>;
  /**
   * Get hexagons owned by a specific user
   * Requires: Authentication
   */
  userHexagons: Array<Hexagon>;
  /**
   * Get public stats for a user (aggregated data only)
   * Returns activity count, distance, and hexagon count
   * Requires: Authentication
   */
  userPublicStats: Maybe<UserPublicStats>;
  /**
   * Get all users (Admin only)
   * Requires: Authentication + Admin
   */
  users: Array<User>;
  /**
   * Get multiple users by their IDs
   * Requires: Authentication
   */
  usersByIds: Array<User>;
  /**
   * Get total count of all users (Admin only)
   * Requires: Authentication + Admin
   */
  usersCount: Scalars['Int']['output'];
  /**
   * Get versus stats between two users (how many hexes each stole directly from the other)
   * Requires: Authentication
   */
  versusStats: VersusStats;
};


export type QueryActivitiesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryActivityArgs = {
  id: Scalars['ID']['input'];
};


export type QueryContestedHexagonsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryHexagonArgs = {
  hexagonId: Scalars['String']['input'];
};


export type QueryHexagonsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryHexagonsByParentArgs = {
  parentHexagonId: Scalars['String']['input'];
};


export type QueryHexagonsByParentsArgs = {
  parentHexagonIds: Array<Scalars['String']['input']>;
};


export type QueryHexagonsInBboxArgs = {
  east: Scalars['Float']['input'];
  north: Scalars['Float']['input'];
  south: Scalars['Float']['input'];
  west: Scalars['Float']['input'];
};


export type QueryHexagonsStolenFromUserArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryMyActivitiesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMyHexagonsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMyHexagonsInBboxArgs = {
  east: Scalars['Float']['input'];
  north: Scalars['Float']['input'];
  south: Scalars['Float']['input'];
  west: Scalars['Float']['input'];
};


export type QueryMyNotificationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
};


export type QueryNotificationsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRegionalActiveLeadersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  parentHexagonIds: Array<Scalars['String']['input']>;
};


export type QueryRegionalOgDiscoverersArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  parentHexagonIds: Array<Scalars['String']['input']>;
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserActivitiesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['ID']['input'];
};


export type QueryUserHexagonsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  userId: Scalars['ID']['input'];
};


export type QueryUserPublicStatsArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryUsersByIdsArgs = {
  ids: Array<Scalars['ID']['input']>;
};


export type QueryVersusStatsArgs = {
  userId1: Scalars['ID']['input'];
  userId2: Scalars['ID']['input'];
};

export type StravaProfile = {
  __typename: 'StravaProfile';
  city: Maybe<Scalars['String']['output']>;
  country: Maybe<Scalars['String']['output']>;
  firstname: Scalars['String']['output'];
  imghex: Maybe<Scalars['String']['output']>;
  lastname: Scalars['String']['output'];
  profile: Maybe<Scalars['String']['output']>;
  sex: Maybe<Scalars['String']['output']>;
  state: Maybe<Scalars['String']['output']>;
  username: Maybe<Scalars['String']['output']>;
};

export type User = {
  __typename: 'User';
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  isAdmin: Scalars['Boolean']['output'];
  isPremium: Scalars['Boolean']['output'];
  lastHex: Maybe<Scalars['String']['output']>;
  stravaId: Scalars['Int']['output'];
  stravaProfile: StravaProfile;
  tokenExpiresAt: Scalars['Int']['output'];
  tokenIsExpired: Scalars['Boolean']['output'];
  updatedAt: Scalars['Date']['output'];
};

export type UserPublicStats = {
  __typename: 'UserPublicStats';
  createdAt: Scalars['Date']['output'];
  id: Scalars['ID']['output'];
  latestActivityDate: Maybe<Scalars['Date']['output']>;
  stravaId: Scalars['Int']['output'];
  stravaProfile: StravaProfile;
  totalActivities: Scalars['Int']['output'];
  totalDistance: Scalars['Float']['output'];
  totalHexagons: Scalars['Int']['output'];
  totalMovingTime: Scalars['Float']['output'];
};

export type VersusStats = {
  __typename: 'VersusStats';
  user1StolenFromUser2: Scalars['Int']['output'];
  user2StolenFromUser1: Scalars['Int']['output'];
};

export type NotificationFieldsFragment = { __typename: 'Notification', id: string, type: NotificationType, message: string, read: boolean, relatedActivityId: string | null, createdAt: unknown };

export type MyNotificationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  unreadOnly?: InputMaybe<Scalars['Boolean']['input']>;
}>;


export type MyNotificationsQuery = { myNotifications: Array<{ __typename: 'Notification', id: string, type: NotificationType, message: string, read: boolean, relatedActivityId: string | null, createdAt: unknown }> };

export type MyUnreadNotificationCountQueryVariables = Exact<{ [key: string]: never; }>;


export type MyUnreadNotificationCountQuery = { myUnreadNotificationCount: number };

export type MarkNotificationAsReadMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type MarkNotificationAsReadMutation = { markNotificationAsRead: { __typename: 'Notification', id: string, type: NotificationType, message: string, read: boolean, relatedActivityId: string | null, createdAt: unknown } };

export type MarkAllNotificationsAsReadMutationVariables = Exact<{ [key: string]: never; }>;


export type MarkAllNotificationsAsReadMutation = { markAllNotificationsAsRead: number };

export type DeleteNotificationMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteNotificationMutation = { deleteNotification: boolean };

export type AllNotificationsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type AllNotificationsQuery = { notifications: Array<{ __typename: 'Notification', id: string, type: NotificationType, message: string, read: boolean, relatedActivityId: string | null, createdAt: unknown }> };

export type NotificationsCountQueryVariables = Exact<{ [key: string]: never; }>;


export type NotificationsCountQuery = { notificationsCount: number };

export type MeQueryVariables = Exact<{ [key: string]: never; }>;


export type MeQuery = { me: { __typename: 'User', id: string, stravaId: number, isAdmin: boolean, isPremium: boolean, tokenExpiresAt: number, tokenIsExpired: boolean, lastHex: string | null, createdAt: unknown, updatedAt: unknown, stravaProfile: { __typename: 'StravaProfile', firstname: string, lastname: string, profile: string | null, imghex: string | null, city: string | null, state: string | null, country: string | null, sex: string | null, username: string | null } } | null };

export type GetUsersQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUsersQuery = { users: Array<{ __typename: 'User', id: string, stravaId: number, isAdmin: boolean, tokenExpiresAt: number, tokenIsExpired: boolean, lastHex: string | null, createdAt: unknown, updatedAt: unknown, stravaProfile: { __typename: 'StravaProfile', firstname: string, lastname: string, profile: string | null, imghex: string | null, city: string | null, state: string | null, country: string | null, sex: string | null, username: string | null } }> };

export type DeleteUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeleteUserMutation = { deleteUser: boolean };

export type RefreshUserTokenMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type RefreshUserTokenMutation = { refreshUserToken: { __typename: 'User', id: string, tokenExpiresAt: number, tokenIsExpired: boolean } };

export type HexagonsByParentsQueryVariables = Exact<{
  parentHexagonIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
}>;


export type HexagonsByParentsQuery = { hexagonsByParents: Array<{ __typename: 'Hexagon', hexagonId: string, currentOwnerId: string, currentOwnerStravaId: number, currentOwnerIsPremium: boolean | null, currentOwnerImghex: string | null, currentStravaActivityId: number, activityType: string, captureCount: number, lastCapturedAt: unknown }> };

export type HexagonsByParentQueryVariables = Exact<{
  parentHexagonId: Scalars['String']['input'];
}>;


export type HexagonsByParentQuery = { hexagonsByParent: Array<{ __typename: 'Hexagon', hexagonId: string, currentOwnerId: string, currentOwnerStravaId: number, currentOwnerIsPremium: boolean | null, currentOwnerImghex: string | null, currentStravaActivityId: number, activityType: string, captureCount: number, lastCapturedAt: unknown }> };

export type HexagonDetailQueryVariables = Exact<{
  hexagonId: Scalars['String']['input'];
}>;


export type HexagonDetailQuery = { hexagon: { __typename: 'Hexagon', hexagonId: string, captureCount: number, firstCapturedAt: unknown, lastCapturedAt: unknown, currentOwner: { __typename: 'User', id: string, stravaId: number, stravaProfile: { __typename: 'StravaProfile', firstname: string, profile: string | null, imghex: string | null } } | null, firstCapturedBy: { __typename: 'User', id: string, stravaId: number, stravaProfile: { __typename: 'StravaProfile', firstname: string, profile: string | null, imghex: string | null } } | null, currentActivity: { __typename: 'Activity', id: string, stravaActivityId: number, name: string, distance: number, averageSpeed: number, startDateLocal: unknown, movingTime: number } | null, captureHistory: Array<{ __typename: 'CaptureHistoryEntry', userId: string, stravaId: number, activityId: string, stravaActivityId: number, capturedAt: unknown, activityType: string, user: { __typename: 'User', id: string, stravaId: number, stravaProfile: { __typename: 'StravaProfile', firstname: string, profile: string | null, imghex: string | null } } | null, activity: { __typename: 'Activity', id: string, stravaActivityId: number, distance: number, averageSpeed: number, startDateLocal: unknown } | null }> } | null };

export type DeleteMyAccountMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteMyAccountMutation = { deleteMyAccount: boolean };

export type MyActivitiesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type MyActivitiesQuery = { myActivities: Array<{ __typename: 'Activity', id: string, stravaActivityId: number, userId: string, name: string, type: string, sportType: string | null, startDate: unknown, startDateLocal: unknown, movingTime: number, distance: number, averageSpeed: number, lastHex: string | null, createdAt: unknown }> };

export type MyHexagonsForStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyHexagonsForStatsQuery = { myHexagons: Array<{ __typename: 'Hexagon', id: string, hexagonId: string, captureCount: number, firstCapturedAt: unknown, lastCapturedAt: unknown, currentOwnerId: string, firstCapturedBy: { __typename: 'User', id: string } | null, captureHistory: Array<{ __typename: 'CaptureHistoryEntry', userId: string, stravaId: number, capturedAt: unknown }> }> };

export type MyActivitiesForStatsQueryVariables = Exact<{ [key: string]: never; }>;


export type MyActivitiesForStatsQuery = { myActivities: Array<{ __typename: 'Activity', id: string, distance: number, movingTime: number, startDateLocal: unknown, createdAt: unknown }> };

export type GetAllHexagonsQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetAllHexagonsQuery = { hexagons: Array<{ __typename: 'Hexagon', id: string, hexagonId: string, currentOwnerId: string, currentOwnerStravaId: number, currentOwnerIsPremium: boolean | null, currentOwnerImghex: string | null, currentActivityId: string, currentStravaActivityId: number, captureCount: number, firstCapturedAt: unknown, lastCapturedAt: unknown, activityType: string, routeType: string | null, createdAt: unknown, updatedAt: unknown }> };

export type GetAllActivitiesQueryVariables = Exact<{
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
}>;


export type GetAllActivitiesQuery = { activities: Array<{ __typename: 'Activity', id: string, stravaActivityId: number, userId: string, source: string, name: string, type: string, sportType: string | null, description: string | null, startDate: unknown, startDateLocal: unknown, timezone: string | null, movingTime: number, elapsedTime: number, distance: number, elevationGain: number, averageSpeed: number, summaryPolyline: string | null, isManual: boolean, isPrivate: boolean, lastHex: string | null, createdAt: unknown, updatedAt: unknown, startLocation: { __typename: 'Location', lat: number, lng: number } | null, endLocation: { __typename: 'Location', lat: number, lng: number } | null }> };

export type GetUsersCountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetUsersCountQuery = { usersCount: number };

export type GetHexagonsCountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetHexagonsCountQuery = { hexagonsCount: number };

export type GetActivitiesCountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActivitiesCountQuery = { activitiesCount: number };

export type RegionalActiveLeadersQueryVariables = Exact<{
  parentHexagonIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type RegionalActiveLeadersQuery = { regionalActiveLeaders: Array<{ __typename: 'LeaderboardEntry', hexCount: number, user: { __typename: 'User', id: string, stravaId: number, stravaProfile: { __typename: 'StravaProfile', firstname: string, lastname: string, profile: string | null, imghex: string | null } } | null }> };

export type RegionalOgDiscoverersQueryVariables = Exact<{
  parentHexagonIds: Array<Scalars['String']['input']> | Scalars['String']['input'];
  limit?: InputMaybe<Scalars['Int']['input']>;
}>;


export type RegionalOgDiscoverersQuery = { regionalOGDiscoverers: Array<{ __typename: 'LeaderboardEntry', hexCount: number, user: { __typename: 'User', id: string, stravaId: number, stravaProfile: { __typename: 'StravaProfile', firstname: string, lastname: string, profile: string | null, imghex: string | null } } | null }> };

export type UserQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UserQuery = { user: { __typename: 'User', id: string, stravaId: number, isAdmin: boolean, isPremium: boolean, tokenExpiresAt: number, tokenIsExpired: boolean, lastHex: string | null, createdAt: unknown, updatedAt: unknown, stravaProfile: { __typename: 'StravaProfile', firstname: string, lastname: string, profile: string | null, imghex: string | null, city: string | null, state: string | null, country: string | null, sex: string | null, username: string | null } } | null };

export type UserHexagonsForStatsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type UserHexagonsForStatsQuery = { userHexagons: Array<{ __typename: 'Hexagon', id: string, hexagonId: string, captureCount: number, firstCapturedAt: unknown, lastCapturedAt: unknown, currentOwnerId: string, firstCapturedBy: { __typename: 'User', id: string } | null }> };

export type HexagonsStolenFromUserQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type HexagonsStolenFromUserQuery = { hexagonsStolenFromUser: Array<{ __typename: 'Hexagon', id: string, hexagonId: string, currentOwnerId: string, currentOwnerStravaId: number }> };

export type UserActivitiesForStatsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type UserActivitiesForStatsQuery = { userActivities: Array<{ __typename: 'Activity', id: string, distance: number, movingTime: number, startDateLocal: unknown, createdAt: unknown }> };

export type UserPublicStatsQueryVariables = Exact<{
  userId: Scalars['ID']['input'];
}>;


export type UserPublicStatsQuery = { userPublicStats: { __typename: 'UserPublicStats', id: string, stravaId: number, totalActivities: number, totalDistance: number, totalMovingTime: number, latestActivityDate: unknown | null, totalHexagons: number, createdAt: unknown, stravaProfile: { __typename: 'StravaProfile', firstname: string, lastname: string, profile: string | null, imghex: string | null, city: string | null, state: string | null, country: string | null, sex: string | null, username: string | null } } | null };

export type UsersByIdsQueryVariables = Exact<{
  ids: Array<Scalars['ID']['input']> | Scalars['ID']['input'];
}>;


export type UsersByIdsQuery = { usersByIds: Array<{ __typename: 'User', id: string, stravaId: number, stravaProfile: { __typename: 'StravaProfile', firstname: string, lastname: string, profile: string | null, imghex: string | null } }> };

export type VersusStatsQueryVariables = Exact<{
  userId1: Scalars['ID']['input'];
  userId2: Scalars['ID']['input'];
}>;


export type VersusStatsQuery = { versusStats: { __typename: 'VersusStats', user1StolenFromUser2: number, user2StolenFromUser1: number } };

export type MyHexagonsCountForShareQueryVariables = Exact<{ [key: string]: never; }>;


export type MyHexagonsCountForShareQuery = { me: { __typename: 'User', id: string, stravaProfile: { __typename: 'StravaProfile', firstname: string, imghex: string | null } } | null, myHexagons: Array<{ __typename: 'Hexagon', id: string }> };

export const NotificationFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"read"}},{"kind":"Field","name":{"kind":"Name","value":"relatedActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<NotificationFieldsFragment, unknown>;
export const MyNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"unreadOnly"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myNotifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}},{"kind":"Argument","name":{"kind":"Name","value":"unreadOnly"},"value":{"kind":"Variable","name":{"kind":"Name","value":"unreadOnly"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"read"}},{"kind":"Field","name":{"kind":"Name","value":"relatedActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<MyNotificationsQuery, MyNotificationsQueryVariables>;
export const MyUnreadNotificationCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyUnreadNotificationCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myUnreadNotificationCount"}}]}}]} as unknown as DocumentNode<MyUnreadNotificationCountQuery, MyUnreadNotificationCountQueryVariables>;
export const MarkNotificationAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkNotificationAsRead"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markNotificationAsRead"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"read"}},{"kind":"Field","name":{"kind":"Name","value":"relatedActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<MarkNotificationAsReadMutation, MarkNotificationAsReadMutationVariables>;
export const MarkAllNotificationsAsReadDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"MarkAllNotificationsAsRead"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"markAllNotificationsAsRead"}}]}}]} as unknown as DocumentNode<MarkAllNotificationsAsReadMutation, MarkAllNotificationsAsReadMutationVariables>;
export const DeleteNotificationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteNotification"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteNotification"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteNotificationMutation, DeleteNotificationMutationVariables>;
export const AllNotificationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AllNotifications"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notifications"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"NotificationFields"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"NotificationFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Notification"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"read"}},{"kind":"Field","name":{"kind":"Name","value":"relatedActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]} as unknown as DocumentNode<AllNotificationsQuery, AllNotificationsQueryVariables>;
export const NotificationsCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"NotificationsCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"notificationsCount"}}]}}]} as unknown as DocumentNode<NotificationsCountQuery, NotificationsCountQueryVariables>;
export const MeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"isAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"isPremium"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"sex"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"tokenIsExpired"}},{"kind":"Field","name":{"kind":"Name","value":"lastHex"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<MeQuery, MeQueryVariables>;
export const GetUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"isAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"sex"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"tokenIsExpired"}},{"kind":"Field","name":{"kind":"Name","value":"lastHex"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const DeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteUserMutation, DeleteUserMutationVariables>;
export const RefreshUserTokenDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RefreshUserToken"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"refreshUserToken"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"tokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"tokenIsExpired"}}]}}]}}]} as unknown as DocumentNode<RefreshUserTokenMutation, RefreshUserTokenMutationVariables>;
export const HexagonsByParentsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HexagonsByParents"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentHexagonIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hexagonsByParents"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentHexagonIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentHexagonIds"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hexagonId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerStravaId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerIsPremium"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerImghex"}},{"kind":"Field","name":{"kind":"Name","value":"currentStravaActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"captureCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastCapturedAt"}}]}}]}}]} as unknown as DocumentNode<HexagonsByParentsQuery, HexagonsByParentsQueryVariables>;
export const HexagonsByParentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HexagonsByParent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentHexagonId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hexagonsByParent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentHexagonId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentHexagonId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hexagonId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerStravaId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerIsPremium"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerImghex"}},{"kind":"Field","name":{"kind":"Name","value":"currentStravaActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"captureCount"}},{"kind":"Field","name":{"kind":"Name","value":"lastCapturedAt"}}]}}]}}]} as unknown as DocumentNode<HexagonsByParentQuery, HexagonsByParentQueryVariables>;
export const HexagonDetailDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HexagonDetail"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hexagonId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hexagon"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"hexagonId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hexagonId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hexagonId"}},{"kind":"Field","name":{"kind":"Name","value":"captureCount"}},{"kind":"Field","name":{"kind":"Name","value":"firstCapturedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastCapturedAt"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwner"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"firstCapturedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentActivity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"distance"}},{"kind":"Field","name":{"kind":"Name","value":"averageSpeed"}},{"kind":"Field","name":{"kind":"Name","value":"startDateLocal"}},{"kind":"Field","name":{"kind":"Name","value":"movingTime"}}]}},{"kind":"Field","name":{"kind":"Name","value":"captureHistory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"activityId"}},{"kind":"Field","name":{"kind":"Name","value":"activity"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"distance"}},{"kind":"Field","name":{"kind":"Name","value":"averageSpeed"}},{"kind":"Field","name":{"kind":"Name","value":"startDateLocal"}}]}},{"kind":"Field","name":{"kind":"Name","value":"stravaActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"capturedAt"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}}]}}]}}]}}]} as unknown as DocumentNode<HexagonDetailQuery, HexagonDetailQueryVariables>;
export const DeleteMyAccountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteMyAccount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteMyAccount"}}]}}]} as unknown as DocumentNode<DeleteMyAccountMutation, DeleteMyAccountMutationVariables>;
export const MyActivitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyActivities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myActivities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"sportType"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"startDateLocal"}},{"kind":"Field","name":{"kind":"Name","value":"movingTime"}},{"kind":"Field","name":{"kind":"Name","value":"distance"}},{"kind":"Field","name":{"kind":"Name","value":"averageSpeed"}},{"kind":"Field","name":{"kind":"Name","value":"lastHex"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MyActivitiesQuery, MyActivitiesQueryVariables>;
export const MyHexagonsForStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyHexagonsForStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myHexagons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hexagonId"}},{"kind":"Field","name":{"kind":"Name","value":"captureCount"}},{"kind":"Field","name":{"kind":"Name","value":"firstCapturedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastCapturedAt"}},{"kind":"Field","name":{"kind":"Name","value":"firstCapturedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerId"}},{"kind":"Field","name":{"kind":"Name","value":"captureHistory"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"capturedAt"}}]}}]}}]}}]} as unknown as DocumentNode<MyHexagonsForStatsQuery, MyHexagonsForStatsQueryVariables>;
export const MyActivitiesForStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyActivitiesForStats"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"myActivities"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"distance"}},{"kind":"Field","name":{"kind":"Name","value":"movingTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDateLocal"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<MyActivitiesForStatsQuery, MyActivitiesForStatsQueryVariables>;
export const GetAllHexagonsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllHexagons"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hexagons"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hexagonId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerStravaId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerIsPremium"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerImghex"}},{"kind":"Field","name":{"kind":"Name","value":"currentActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"currentStravaActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"captureCount"}},{"kind":"Field","name":{"kind":"Name","value":"firstCapturedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastCapturedAt"}},{"kind":"Field","name":{"kind":"Name","value":"activityType"}},{"kind":"Field","name":{"kind":"Name","value":"routeType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetAllHexagonsQuery, GetAllHexagonsQueryVariables>;
export const GetAllActivitiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllActivities"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"offset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"offset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"offset"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaActivityId"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"sportType"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"startDateLocal"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"movingTime"}},{"kind":"Field","name":{"kind":"Name","value":"elapsedTime"}},{"kind":"Field","name":{"kind":"Name","value":"distance"}},{"kind":"Field","name":{"kind":"Name","value":"elevationGain"}},{"kind":"Field","name":{"kind":"Name","value":"averageSpeed"}},{"kind":"Field","name":{"kind":"Name","value":"startLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}}]}},{"kind":"Field","name":{"kind":"Name","value":"endLocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lat"}},{"kind":"Field","name":{"kind":"Name","value":"lng"}}]}},{"kind":"Field","name":{"kind":"Name","value":"summaryPolyline"}},{"kind":"Field","name":{"kind":"Name","value":"isManual"}},{"kind":"Field","name":{"kind":"Name","value":"isPrivate"}},{"kind":"Field","name":{"kind":"Name","value":"lastHex"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<GetAllActivitiesQuery, GetAllActivitiesQueryVariables>;
export const GetUsersCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsersCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"usersCount"}}]}}]} as unknown as DocumentNode<GetUsersCountQuery, GetUsersCountQueryVariables>;
export const GetHexagonsCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHexagonsCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hexagonsCount"}}]}}]} as unknown as DocumentNode<GetHexagonsCountQuery, GetHexagonsCountQueryVariables>;
export const GetActivitiesCountDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActivitiesCount"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"activitiesCount"}}]}}]} as unknown as DocumentNode<GetActivitiesCountQuery, GetActivitiesCountQueryVariables>;
export const RegionalActiveLeadersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RegionalActiveLeaders"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentHexagonIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regionalActiveLeaders"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentHexagonIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentHexagonIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"hexCount"}}]}}]}}]} as unknown as DocumentNode<RegionalActiveLeadersQuery, RegionalActiveLeadersQueryVariables>;
export const RegionalOgDiscoverersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"RegionalOGDiscoverers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"parentHexagonIds"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"regionalOGDiscoverers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"parentHexagonIds"},"value":{"kind":"Variable","name":{"kind":"Name","value":"parentHexagonIds"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"hexCount"}}]}}]}}]} as unknown as DocumentNode<RegionalOgDiscoverersQuery, RegionalOgDiscoverersQueryVariables>;
export const UserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"User"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"isAdmin"}},{"kind":"Field","name":{"kind":"Name","value":"isPremium"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"sex"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tokenExpiresAt"}},{"kind":"Field","name":{"kind":"Name","value":"tokenIsExpired"}},{"kind":"Field","name":{"kind":"Name","value":"lastHex"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UserQuery, UserQueryVariables>;
export const UserHexagonsForStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserHexagonsForStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userHexagons"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hexagonId"}},{"kind":"Field","name":{"kind":"Name","value":"captureCount"}},{"kind":"Field","name":{"kind":"Name","value":"firstCapturedAt"}},{"kind":"Field","name":{"kind":"Name","value":"lastCapturedAt"}},{"kind":"Field","name":{"kind":"Name","value":"firstCapturedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerId"}}]}}]}}]} as unknown as DocumentNode<UserHexagonsForStatsQuery, UserHexagonsForStatsQueryVariables>;
export const HexagonsStolenFromUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"HexagonsStolenFromUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"hexagonsStolenFromUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"hexagonId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerId"}},{"kind":"Field","name":{"kind":"Name","value":"currentOwnerStravaId"}}]}}]}}]} as unknown as DocumentNode<HexagonsStolenFromUserQuery, HexagonsStolenFromUserQueryVariables>;
export const UserActivitiesForStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserActivitiesForStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userActivities"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"distance"}},{"kind":"Field","name":{"kind":"Name","value":"movingTime"}},{"kind":"Field","name":{"kind":"Name","value":"startDateLocal"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<UserActivitiesForStatsQuery, UserActivitiesForStatsQueryVariables>;
export const UserPublicStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UserPublicStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userPublicStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}},{"kind":"Field","name":{"kind":"Name","value":"city"}},{"kind":"Field","name":{"kind":"Name","value":"state"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"sex"}},{"kind":"Field","name":{"kind":"Name","value":"username"}}]}},{"kind":"Field","name":{"kind":"Name","value":"totalActivities"}},{"kind":"Field","name":{"kind":"Name","value":"totalDistance"}},{"kind":"Field","name":{"kind":"Name","value":"totalMovingTime"}},{"kind":"Field","name":{"kind":"Name","value":"latestActivityDate"}},{"kind":"Field","name":{"kind":"Name","value":"totalHexagons"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}}]}}]}}]} as unknown as DocumentNode<UserPublicStatsQuery, UserPublicStatsQueryVariables>;
export const UsersByIdsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"UsersByIds"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ids"}},"type":{"kind":"NonNullType","type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"usersByIds"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ids"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ids"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaId"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"lastname"}},{"kind":"Field","name":{"kind":"Name","value":"profile"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}}]}}]}}]}}]} as unknown as DocumentNode<UsersByIdsQuery, UsersByIdsQueryVariables>;
export const VersusStatsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"VersusStats"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId1"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userId2"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"versusStats"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userId1"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId1"}}},{"kind":"Argument","name":{"kind":"Name","value":"userId2"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userId2"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user1StolenFromUser2"}},{"kind":"Field","name":{"kind":"Name","value":"user2StolenFromUser1"}}]}}]}}]} as unknown as DocumentNode<VersusStatsQuery, VersusStatsQueryVariables>;
export const MyHexagonsCountForShareDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"MyHexagonsCountForShare"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"me"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"stravaProfile"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstname"}},{"kind":"Field","name":{"kind":"Name","value":"imghex"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"myHexagons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<MyHexagonsCountForShareQuery, MyHexagonsCountForShareQueryVariables>;