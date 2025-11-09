import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { connectDatabase } from '@/config/database';
import { typeDefs } from '@/graphql/schemas/index';
import { resolvers } from '@/graphql/resolvers/index';
import testRoutes from '@/routes/test.routes';
import stravaRoutes from '@/routes/strava.routes';
import webhookRoutes from '@/routes/webhook.routes';
import expressPlayground from 'graphql-playground-middleware-express';

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
				const { verifyToken, extractTokenFromHeader } = await import('@/utils/jwt');
				const { User } = await import('@/models/User');

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
║   🚀 GetOut Backend                      ║
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
