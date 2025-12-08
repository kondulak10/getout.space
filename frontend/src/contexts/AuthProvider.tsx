import { ReactNode, useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { MeDocument } from "@/gql/graphql";
import { AuthContext, AuthContextType, User } from "./auth.types";
import { refreshToken } from "@/services/stravaApi.service";
import { analytics } from "@/lib/analytics";
import { EmailCollectionOverlay } from "@/components/EmailCollectionOverlay";
const TOKEN_KEY = "getout_auth_token";
export function AuthProvider({ children }: { children: ReactNode }) {
	// Read token synchronously during initialization to eliminate unnecessary loading state
	const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
	const [user, setUser] = useState<User | null>(null);
	const [showEmailOverlay, setShowEmailOverlay] = useState(false);

	const { data: userData, loading: userLoading, error: userError } = useQuery(MeDocument, {
		skip: !token,
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

				// Identify user in analytics with all relevant properties
				analytics.identify(newUser.id, {
					stravaId: newUser.stravaId,
					firstname: newUser.profile.firstname,
					username: newUser.profile.username,
					city: newUser.profile.city,
					state: newUser.profile.state,
					country: newUser.profile.country,
					isAdmin: newUser.isAdmin,
					signup_date: newUser.createdAt,
				});

				// Check if we should show email collection overlay
				// NOTE: Backend only populates activityCount when email is null (see user.resolvers.ts)
				// This is intentional - we only need the count to decide whether to show the overlay
				const hasEmail = userData.me.email != null;
				const activityCount = userData.me.activityCount ?? 0;
				const shouldShowEmailOverlay = !hasEmail && activityCount >= 3;
				setShowEmailOverlay(shouldShowEmailOverlay);

				// Scope validation happens during Strava OAuth registration in backend.
				const now = Math.floor(Date.now() / 1000);
				const timeUntilExpiry = userData.me.tokenExpiresAt - now;
				if (timeUntilExpiry < 3600) {
					try {
						const refreshResponse = await refreshToken();
						if (refreshResponse.success && refreshResponse.user) {
							setUser({
								...newUser,
								tokenExpiresAt: refreshResponse.user.tokenExpiresAt,
							});
						}
					} catch (error) {
						if (error instanceof Error && error.message.includes('revoked')) {
							logout();
						}
					}
				}
			} else if (userError) {
				console.error('❌ Auth Error - Me query failed:', userError);
				console.error('Error details:', {
					message: userError.message,
					graphQLErrors: 'graphQLErrors' in userError ? userError.graphQLErrors : undefined,
					networkError: 'networkError' in userError ? userError.networkError : undefined,
				});
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

		// Track login and identify user in analytics with all relevant properties
		analytics.identify(newUser.id, {
			stravaId: newUser.stravaId,
			firstname: newUser.profile.firstname,
			username: newUser.profile.username,
			city: newUser.profile.city,
			state: newUser.profile.state,
			country: newUser.profile.country,
			isAdmin: newUser.isAdmin,
			signup_date: newUser.createdAt,
		});

		// Track login completed event
		analytics.track('login_completed', {
			user_id: newUser.id,
			strava_id: newUser.stravaId,
		});
	};
	const logout = () => {
		// Track logout event BEFORE resetting analytics (so user is still identified)
		analytics.track('logout', {});

		setToken(null);
		setUser(null);
		localStorage.removeItem(TOKEN_KEY);

		// Reset analytics on logout
		analytics.reset();
	};
	const value: AuthContextType = {
		user,
		token,
		isAuthenticated: !!token,
		isAdmin: user?.isAdmin ?? false,
		isLoading: userLoading,
		login,
		logout,
		setUser,
	};
	return (
		<AuthContext.Provider value={value}>
			{children}
			{showEmailOverlay && (
				<EmailCollectionOverlay onComplete={() => setShowEmailOverlay(false)} />
			)}
		</AuthContext.Provider>
	);
}
