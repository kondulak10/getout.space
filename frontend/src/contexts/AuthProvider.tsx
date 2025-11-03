import { ReactNode, useEffect, useState } from "react";
import { AuthContext, AuthContextType, User } from "./auth.types";

const TOKEN_KEY = "getout_auth_token";
const USER_KEY = "getout_user";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Load auth data from localStorage on mount
	useEffect(() => {
		console.log('🔍 AuthProvider: Loading auth from localStorage...');
		const storedToken = localStorage.getItem(TOKEN_KEY);
		const storedUser = localStorage.getItem(USER_KEY);

		console.log('Token exists:', !!storedToken);
		console.log('User exists:', !!storedUser);

		if (storedToken && storedUser) {
			try {
				const parsedUser = JSON.parse(storedUser);
				setToken(storedToken);
				setUser(parsedUser);
				console.log(`✅ Auth restored: ${parsedUser.profile.firstname} ${parsedUser.profile.lastname}${parsedUser.isAdmin ? ' 👑' : ''}`);
				console.log(`🖼️ Profile: ${parsedUser.profile.profile || 'Not set'}`);
				console.log(`🔷 Hexagon: ${parsedUser.profile.imghex || 'Not set'}`);
			} catch (error) {
				console.error("Failed to parse stored user data:", error);
				// Clear invalid data
				localStorage.removeItem(TOKEN_KEY);
				localStorage.removeItem(USER_KEY);
			}
		} else {
			console.log('⚠️ No auth data in localStorage');
		}

		setIsLoading(false);
	}, []);

	const login = (newToken: string, newUser: User) => {
		setToken(newToken);
		setUser(newUser);
		localStorage.setItem(TOKEN_KEY, newToken);
		localStorage.setItem(USER_KEY, JSON.stringify(newUser));
		console.log("✅ User logged in:", newUser.profile.firstname);
	};

	const logout = () => {
		setToken(null);
		setUser(null);
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
		console.log("👋 User logged out");
	};

	const value: AuthContextType = {
		user,
		token,
		isAuthenticated: !!token && !!user,
		isAdmin: user?.isAdmin ?? false,
		isLoading,
		login,
		logout,
		setUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
