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

	useEffect(() => {
		const initializeAuth = async () => {
			const storedToken = localStorage.getItem(TOKEN_KEY);
			if (storedToken) {
				setToken(storedToken);
			}
			setIsInitialized(true);
		};

		initializeAuth();
	}, []);

	const { data: userData, loading: userLoading, error: userError } = useQuery(MeDocument, {
		skip: !token || !isInitialized,
	});

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
					tokenIsExpired: userData.me.tokenIsExpired ?? false,
					lastHex: userData.me.lastHex || undefined,
					createdAt: String(userData.me.createdAt),
					updatedAt: String(userData.me.updatedAt),
				};
				setUser(newUser);

				// Note: Scope validation now happens during registration in backend.
				// Users cannot register without 'activity:read_all' permission.

				const now = Math.floor(Date.now() / 1000);
				const timeUntilExpiry = userData.me.tokenExpiresAt - now;

				if (timeUntilExpiry < 3600 && timeUntilExpiry > 0) {
					console.log(`🔄 Token expires in ${Math.floor(timeUntilExpiry / 60)} minutes, refreshing...`);
					try {
						const refreshResponse = await refreshToken();
						if (refreshResponse.success && refreshResponse.user) {
							setUser({
								...newUser,
								tokenExpiresAt: refreshResponse.user.tokenExpiresAt,
							});
							console.log('✅ Token refreshed successfully on mount');
						}
					} catch (error) {
						console.error('❌ Failed to refresh token on mount:', error);
						if (error instanceof Error && error.message.includes('revoked')) {
							logout();
						}
					}
				}
			} else if (userError) {
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
		isAuthenticated: !!token,
		isAdmin: user?.isAdmin ?? false,
		isLoading: !isInitialized || userLoading,
		login,
		logout,
		setUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
