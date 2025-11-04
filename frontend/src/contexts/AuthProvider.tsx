import { ReactNode, useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { MeDocument } from "@/gql/graphql";
import { AuthContext, AuthContextType, User } from "./auth.types";

const TOKEN_KEY = "getout_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	// Load token from localStorage on mount
	useEffect(() => {
		const storedToken = localStorage.getItem(TOKEN_KEY);
		if (storedToken) {
			setToken(storedToken);
		}
		setIsInitialized(true);
	}, []);

	// Fetch user data when we have a token
	const { data: userData, loading: userLoading, error: userError } = useQuery(MeDocument, {
		skip: !token || !isInitialized,
	});

	// Update user state when GraphQL data arrives
	useEffect(() => {
		if (userData?.me) {
			setUser({
				id: userData.me.id,
				stravaId: userData.me.stravaId,
				isAdmin: userData.me.isAdmin,
				profile: {
					firstname: userData.me.stravaProfile.firstname,
					lastname: userData.me.stravaProfile.lastname,
					profile: userData.me.stravaProfile.profile || undefined,
					imghex: userData.me.stravaProfile.imghex || undefined,
					city: userData.me.stravaProfile.city || undefined,
					state: userData.me.stravaProfile.state || undefined,
					country: userData.me.stravaProfile.country || undefined,
					sex: userData.me.stravaProfile.sex || undefined,
					username: userData.me.stravaProfile.username || undefined,
				},
				tokenExpiresAt: userData.me.tokenExpiresAt,
				tokenIsExpired: userData.me.tokenIsExpired,
				createdAt: String(userData.me.createdAt),
				updatedAt: String(userData.me.updatedAt),
			});
		} else if (userError) {
			// Token is invalid, clear it
			setToken(null);
			setUser(null);
			localStorage.removeItem(TOKEN_KEY);
		}
	}, [userData, userError]);

	const login = (newToken: string, newUser: User) => {
		setToken(newToken);
		setUser(newUser);
		localStorage.setItem(TOKEN_KEY, newToken);
	};

	const logout = () => {
		setToken(null);
		setUser(null);
		localStorage.removeItem(TOKEN_KEY);
	};

	const value: AuthContextType = {
		user,
		token,
		isAuthenticated: !!token, // Token presence = authenticated (user data may still be loading)
		isAdmin: user?.isAdmin ?? false,
		isLoading: !isInitialized || userLoading,
		login,
		logout,
		setUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
