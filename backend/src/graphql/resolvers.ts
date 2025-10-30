import { User } from '../models/User';

export const resolvers = {
  Query: {
    users: async () => {
      try {
        const users = await User.find().sort({ createdAt: -1 });
        return users;
      } catch (error) {
        console.error('Error fetching users:', error);
        throw new Error('Failed to fetch users');
      }
    },

    user: async (_: any, { id }: { id: string }) => {
      try {
        const user = await User.findById(id);
        return user;
      } catch (error) {
        console.error('Error fetching user:', error);
        throw new Error('Failed to fetch user');
      }
    },
  },

  Mutation: {
    createUser: async (_: any, { name, img }: { name: string; img: string }) => {
      try {
        const user = new User({ name, img });
        await user.save();
        return user;
      } catch (error) {
        console.error('Error creating user:', error);
        throw new Error('Failed to create user');
      }
    },

    deleteUser: async (_: any, { id }: { id: string }) => {
      try {
        await User.findByIdAndDelete(id);
        return true;
      } catch (error) {
        console.error('Error deleting user:', error);
        return false;
      }
    },
  },
};
