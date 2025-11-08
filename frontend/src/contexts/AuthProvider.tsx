import { ReactNode, useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { MeDocument } from "@/gql/graphql";
import { AuthContext, AuthContextType, User } from "./auth.types";
import { refreshToken } from "@/services/stravaApi.service";

const TOKEN_KEY = "getout_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [isInitialized, setIsInitialized] = useState(false);

	// Load token from localStorage on mount and refresh if needed
	useEffect(() => {
		const initializeAuth = async () => {
			const storedToken = localStorage.getItem(TOKEN_KEY);
			if (storedToken) {
				setToken(storedToken);

				// Check if we need to refresh token on mount
				// This will be checked after we get user data
			}
			setIsInitialized(true);
		};

		initializeAuth();
	}, []);

	// Fetch user data when we have a token
	const { data: userData, loading: userLoading, error: userError, refetch } = useQuery(MeDocument, {
		skip: !token || !isInitialized,
	});

	// Update user state when GraphQL data arrives and refresh token if needed
	useEffect(() => {
		const handleUserData = async () => {
			if (userData?.me) {
				const newUser = {
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
				};
				setUser(newUser);

				// Check if token needs refresh (< 1 hour remaining)
				const now = Math.floor(Date.now() / 1000);
				const timeUntilExpiry = userData.me.tokenExpiresAt - now;

				if (timeUntilExpiry < 3600 && timeUntilExpiry > 0) {
					console.log(`🔄 Token expires in ${Math.floor(timeUntilExpiry / 60)} minutes, refreshing...`);
					try {
						const refreshResponse = await refreshToken();
						if (refreshResponse.success && refreshResponse.user) {
							// Update user with new expiry
							setUser({
								...newUser,
								tokenExpiresAt: refreshResponse.user.tokenExpiresAt,
							});
							console.log('✅ Token refreshed successfully on mount');
						}
					} catch (error) {
						console.error('❌ Failed to refresh token on mount:', error);
						// If refresh fails with auth error, logout
						if (error instanceof Error && error.message.includes('revoked')) {
							logout();
						}
					}
				}
			} else if (userError) {
				// Token is invalid, clear it
				setToken(null);
				setUser(null);
				localStorage.removeItem(TOKEN_KEY);
			}
		};

		handleUserData();
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
