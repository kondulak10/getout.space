import * as React from "react";
import { ReactNode, useEffect, useState } from "react";
import { AuthContext, AuthContextType, User } from "./authContext";

const TOKEN_KEY = "getout_auth_token";
const USER_KEY = "getout_user";

export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(null);
	const [user, setUser] = useState<User | null>(null);

	// Load auth data from localStorage on mount
	useEffect(() => {
		const storedToken = localStorage.getItem(TOKEN_KEY);
		const storedUser = localStorage.getItem(USER_KEY);

		if (storedToken && storedUser) {
			try {
				setToken(storedToken);
				setUser(JSON.parse(storedUser));
			} catch (error) {
				console.error("Failed to parse stored user data:", error);
				// Clear invalid data
				localStorage.removeItem(TOKEN_KEY);
				localStorage.removeItem(USER_KEY);
			}
		}
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
		login,
		logout,
		setUser,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
