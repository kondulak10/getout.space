import { TypedDocumentNode as DocumentNode } from "@graphql-typed-document-node/core";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
	[_ in K]?: never;
};
export type Incremental<T> =
	| T
	| { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
	ID: { input: string; output: string };
	String: { input: string; output: string };
	Boolean: { input: boolean; output: boolean };
	Int: { input: number; output: number };
	Float: { input: number; output: number };
};

export type Mutation = {
	__typename: "Mutation";
	/**
	 * Delete user by ID (Admin only)
	 * Requires: Authentication + Admin
	 */
	deleteUser: Scalars["Boolean"]["output"];
};

export type MutationDeleteUserArgs = {
	id: Scalars["ID"]["input"];
};

export type Query = {
	__typename: "Query";
	/**
	 * Get current authenticated user
	 * Requires: Authentication
	 */
	me: Maybe<User>;
	/**
	 * Get user by ID (Admin only, or own profile)
	 * Requires: Authentication
	 */
	user: Maybe<User>;
	/**
	 * Get all users (Admin only)
	 * Requires: Authentication + Admin
	 */
	users: Array<User>;
};

export type QueryUserArgs = {
	id: Scalars["ID"]["input"];
};

export type StravaProfile = {
	__typename: "StravaProfile";
	city: Maybe<Scalars["String"]["output"]>;
	country: Maybe<Scalars["String"]["output"]>;
	firstname: Scalars["String"]["output"];
	lastname: Scalars["String"]["output"];
	profile: Scalars["String"]["output"];
	sex: Maybe<Scalars["String"]["output"]>;
	state: Maybe<Scalars["String"]["output"]>;
	username: Maybe<Scalars["String"]["output"]>;
};

export type User = {
	__typename: "User";
	createdAt: Scalars["String"]["output"];
	id: Scalars["ID"]["output"];
	isAdmin: Scalars["Boolean"]["output"];
	stravaId: Scalars["Int"]["output"];
	stravaProfile: StravaProfile;
	updatedAt: Scalars["String"]["output"];
};

export type GetUsersQueryVariables = Exact<{ [key: string]: never }>;

export type GetUsersQuery = {
	users: Array<{
		__typename: "User";
		id: string;
		stravaId: number;
		isAdmin: boolean;
		createdAt: string;
		updatedAt: string;
		stravaProfile: {
			__typename: "StravaProfile";
			firstname: string;
			lastname: string;
			profile: string;
			city: string | null;
			state: string | null;
			country: string | null;
			sex: string | null;
			username: string | null;
		};
	}>;
};

export type DeleteUserMutationVariables = Exact<{
	id: Scalars["ID"]["input"];
}>;

export type DeleteUserMutation = { deleteUser: boolean };

export const GetUsersDocument = {
	kind: "Document",
	definitions: [
		{
			kind: "OperationDefinition",
			operation: "query",
			name: { kind: "Name", value: "GetUsers" },
			selectionSet: {
				kind: "SelectionSet",
				selections: [
					{
						kind: "Field",
						name: { kind: "Name", value: "users" },
						selectionSet: {
							kind: "SelectionSet",
							selections: [
								{ kind: "Field", name: { kind: "Name", value: "id" } },
								{ kind: "Field", name: { kind: "Name", value: "stravaId" } },
								{ kind: "Field", name: { kind: "Name", value: "isAdmin" } },
								{
									kind: "Field",
									name: { kind: "Name", value: "stravaProfile" },
									selectionSet: {
										kind: "SelectionSet",
										selections: [
											{ kind: "Field", name: { kind: "Name", value: "firstname" } },
											{ kind: "Field", name: { kind: "Name", value: "lastname" } },
											{ kind: "Field", name: { kind: "Name", value: "profile" } },
											{ kind: "Field", name: { kind: "Name", value: "city" } },
											{ kind: "Field", name: { kind: "Name", value: "state" } },
											{ kind: "Field", name: { kind: "Name", value: "country" } },
											{ kind: "Field", name: { kind: "Name", value: "sex" } },
											{ kind: "Field", name: { kind: "Name", value: "username" } },
										],
									},
								},
								{ kind: "Field", name: { kind: "Name", value: "createdAt" } },
								{ kind: "Field", name: { kind: "Name", value: "updatedAt" } },
							],
						},
					},
				],
			},
		},
	],
} as unknown as DocumentNode<GetUsersQuery, GetUsersQueryVariables>;
export const DeleteUserDocument = {
	kind: "Document",
	definitions: [
		{
			kind: "OperationDefinition",
			operation: "mutation",
			name: { kind: "Name", value: "DeleteUser" },
			variableDefinitions: [
				{
					kind: "VariableDefinition",
					variable: { kind: "Variable", name: { kind: "Name", value: "id" } },
					type: {
						kind: "NonNullType",
						type: { kind: "NamedType", name: { kind: "Name", value: "ID" } },
					},
				},
			],
			selectionSet: {
				kind: "SelectionSet",
				selections: [
					{
						kind: "Field",
						name: { kind: "Name", value: "deleteUser" },
						arguments: [
							{
								kind: "Argument",
								name: { kind: "Name", value: "id" },
								value: { kind: "Variable", name: { kind: "Name", value: "id" } },
							},
						],
					},
				],
			},
		},
	],
} as unknown as DocumentNode<DeleteUserMutation, DeleteUserMutationVariables>;
