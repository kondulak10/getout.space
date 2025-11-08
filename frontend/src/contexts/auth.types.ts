import { createContext } from 'react';

interface StravaProfile {
  firstname: string;
  lastname: string;
  profile?: string;
  imghex?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: string;
  username?: string;
}

interface User {
  id: string;
  stravaId: number;
  isAdmin: boolean;
  profile: StravaProfile;
  tokenExpiresAt: number;
  tokenIsExpired: boolean;
  createdAt: string;
  updatedAt: string;
  lastHex?: string; // Resolution 6 parent hex from most recent activity
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export type { User, StravaProfile, AuthContextType };
