export const notificationTypeDefs = `
  enum NotificationType {
    positive
    negative
    neutral
  }

  type Notification {
    id: ID!
    type: NotificationType!
    message: String!
    read: Boolean!
    relatedActivityId: ID
    triggeredBy: UserPublic
    createdAt: Date!
  }

  extend type Query {
    # User queries
    myNotifications(limit: Int, offset: Int, unreadOnly: Boolean): [Notification!]!
    myUnreadNotificationCount: Int!

    # Admin queries
    notifications(limit: Int, offset: Int): [Notification!]!
    notificationsCount: Int!
  }

  extend type Mutation {
    markNotificationAsRead(id: ID!): Notification!
    markAllNotificationsAsRead: Int!
    deleteNotification(id: ID!): Boolean!
  }
`;
