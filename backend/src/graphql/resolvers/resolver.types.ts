import { GraphQLResolveInfo } from 'graphql';
import { GraphQLContext } from './auth.helpers';

/**
 * Generic resolver function type
 * @template TParent - The type of the parent object
 * @template TArgs - The type of the arguments object
 * @template TResult - The type of the result
 */
export type Resolver<TParent = unknown, TArgs = unknown, TResult = unknown> = (
	parent: TParent,
	args: TArgs,
	context: GraphQLContext,
	info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

/**
 * Resolver without arguments
 */
export type ResolverWithoutArgs<TParent = unknown, TResult = unknown> = Resolver<
	TParent,
	Record<string, never>,
	TResult
>;

/**
 * Common argument types for queries
 */
export interface PaginationArgs {
	limit?: number;
	offset?: number;
}

export interface IdArg {
	id: string;
}

export interface ParentHexagonsArgs {
	parentIds: string[];
}

export interface BboxArgs {
	bbox: [number, number, number, number];
}

export interface ActivityIdArg {
	activityId: string;
}

export interface StravaActivityIdArg {
	stravaActivityId: number;
}

export interface HexagonIdArg {
	hexagonId: string;
}

export interface BboxCoordinatesArgs {
	south: number;
	west: number;
	north: number;
	east: number;
}

export interface ParentHexagonIdsArg {
	parentHexagonIds: string[];
}

export interface LimitArg {
	limit?: number;
}

export interface ParentHexagonIdsWithLimitArgs {
	parentHexagonIds: string[];
	limit?: number;
}

export interface CaptureHexagonsArgs {
	activityId: string;
	hexagonIds: string[];
	routeType?: string;
}

/**
 * User resolver argument types
 */
export interface UpdateProfileArgs {
	displayName?: string;
	bio?: string;
	profileImageFile?: unknown; // File upload type
}

export interface TogglePremiumArgs {
	userId: string;
	isPremium: boolean;
}

/**
 * Activity resolver argument types
 */
export interface DeleteActivityArgs {
	activityId: string;
}

export interface ProcessActivityArgs {
	stravaActivityId: number;
}

export interface UserIdWithPaginationArgs extends PaginationArgs {
	userId: string;
}

/**
 * Notification resolver argument types
 */
export interface MarkNotificationAsReadArgs {
	id: string;
}

export interface DeleteNotificationArgs {
	id: string;
}

/**
 * Helper type to extract resolver args from a resolver function
 */
export type ArgsOf<T> = T extends Resolver<unknown, infer TArgs, unknown> ? TArgs : never;
