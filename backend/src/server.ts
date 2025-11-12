import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import expressPlayground from 'graphql-playground-middleware-express';
import path from 'path';
import { connectDatabase } from './config/database';
import { resolvers } from './graphql/resolvers/index';
import { typeDefs } from './graphql/schemas/index';
import stravaRoutes from './routes/strava.routes';
import testRoutes from './routes/test.routes';
import webhookRoutes from './routes/webhook.routes';

const PORT = process.env.PORT || 4000;

const app = express();

connectDatabase();

app.use(
	cors({
		origin: [
			'http://localhost:5173',
			'http://localhost:3000',
			'https://getout.space',
			'https://www.getout.space',
		],
		credentials: true,
	})
);
app.use(express.json());

// Simple request/response logging middleware
app.use((req, res, next) => {
	const startTime = Date.now();

	// Skip logging for GraphQL introspection queries (they're noisy)
	const isIntrospectionQuery =
		req.path === '/graphql' && req.body?.operationName === 'IntrospectionQuery';

	if (!isIntrospectionQuery) {
		const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
		console.log(`\x1b[2m[${timestamp}] ${req.method} ${req.path}\x1b[0m`);
	}

	// Capture response
	const originalJson = res.json;

	res.json = function (data) {
		if (!isIntrospectionQuery) {
			const duration = Date.now() - startTime;
			const statusCode = res.statusCode;
			const isError = statusCode >= 400;

			// Check for GraphQL errors
			const hasGraphQLErrors = req.path === '/graphql' && data?.errors?.length > 0;

			if (isError || hasGraphQLErrors) {
				console.log(`\x1b[31m❌ ${statusCode} | ${duration}ms | ${req.method} ${req.path}\x1b[0m`);
				if (hasGraphQLErrors) {
					console.log(`\x1b[31m   Errors: ${JSON.stringify(data.errors, null, 2)}\x1b[0m`);
				}
			} else {
				console.log(`\x1b[2m✓ ${statusCode} | ${duration}ms | ${req.method} ${req.path}\x1b[0m`);
			}
		}
		return originalJson.call(this, data);
	};

	next();
});

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, 'templates', 'landing.html'));
});

app.use(testRoutes);
app.use(stravaRoutes);
app.use(webhookRoutes);

const startApolloServer = async () => {
	const server = new ApolloServer({
		typeDefs,
		resolvers,
		introspection: true,
	});

	await server.start();

	app.use(
		'/graphql',
		expressMiddleware(server, {
			context: async ({ req }) => {
				const { verifyToken, extractTokenFromHeader } = await import('./utils/jwt');
				const { User } = await import('./models/User');

				const token = extractTokenFromHeader(req.headers.authorization);

				if (token) {
					try {
						const payload = verifyToken(token);
						const user = await User.findById(payload.userId);

						if (user) {
							return {
								user,
								userId: payload.userId,
								isAuthenticated: true,
							};
						}
					} catch (error) {
						console.log('Invalid token in GraphQL request');
					}
				}

				return {
					user: undefined,
					userId: undefined,
					isAuthenticated: false,
				};
			},
		})
	);

	app.get(
		'/playground',
		expressPlayground({
			endpoint: '/graphql',
			settings: {
				'request.credentials': 'include',
			},
		})
	);

	app.listen(PORT, () => {
		console.log(`
╔═══════════════════════════════════════════╗
║   🚀 GetOut Backend!                      ║
╠═══════════════════════════════════════════╣
║   Health:   http://localhost:${PORT}/health     ║
║   GraphQL:  http://localhost:${PORT}/graphql    ║
║   Test:     http://localhost:${PORT}/api/test   ║
╚═══════════════════════════════════════════╝
    `);
	});
};

startApolloServer().catch((error) => {
	console.error('Failed to start Apollo Server:', error);
	process.exit(1);
});
