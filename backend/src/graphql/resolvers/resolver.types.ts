import { GraphQLResolveInfo } from 'graphql';
import { GraphQLContext } from './auth.helpers';

export type Resolver<TParent = unknown, TArgs = unknown, TResult = unknown> = (
	parent: TParent,
	args: TArgs,
	context: GraphQLContext,
	info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type ResolverWithoutArgs<TParent = unknown, TResult = unknown> = Resolver<
	TParent,
	Record<string, never>,
	TResult
>;

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

export interface UpdateProfileArgs {
	displayName?: string;
	bio?: string;
	profileImageFile?: unknown;
}

export interface TogglePremiumArgs {
	userId: string;
	isPremium: boolean;
}

export interface DeleteActivityArgs {
	activityId: string;
}

export interface ProcessActivityArgs {
	stravaActivityId: number;
}

export interface UserIdWithPaginationArgs extends PaginationArgs {
	userId: string;
}

export interface UserIdArg {
	userId: string;
}

export interface MarkNotificationAsReadArgs {
	id: string;
}

export interface DeleteNotificationArgs {
	id: string;
}

export type ArgsOf<T> = T extends Resolver<unknown, infer TArgs, unknown> ? TArgs : never;
