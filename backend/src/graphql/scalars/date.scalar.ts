import { GraphQLScalarType, Kind } from 'graphql';

export const DateScalar = new GraphQLScalarType({
	name: 'Date',
	description: 'Date custom scalar type (ISO 8601 string)',

	serialize(value: unknown): string {
		if (value instanceof Date) {
			return value.toISOString();
		}
		if (typeof value === 'string') {
			return value;
		}
		if (typeof value === 'number') {
			return new Date(value).toISOString();
		}
		throw new Error('GraphQL Date Scalar serializer expected a `Date` object');
	},

	parseValue(value: unknown): Date {
		if (typeof value === 'number' || typeof value === 'string') {
			return new Date(value);
		}
		throw new Error('GraphQL Date Scalar parser expected a `number` or `string`');
	},

	parseLiteral(ast): Date {
		if (ast.kind === Kind.INT) {
			return new Date(parseInt(ast.value, 10));
		}
		if (ast.kind === Kind.STRING) {
			return new Date(ast.value);
		}
		throw new Error('GraphQL Date Scalar parser expected a `number` or `string`');
	},
});
