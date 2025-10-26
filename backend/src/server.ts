import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import testRoutes from './routes/test.routes';
import stravaRoutes from './routes/strava.routes';

const PORT = process.env.PORT || 4000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(testRoutes);
app.use(stravaRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════╗
║   🚀 GetOut Backend (Simple Mode)        ║
╠═══════════════════════════════════════════╣
║   Health:   http://localhost:${PORT}/health     ║
║   Test:     http://localhost:${PORT}/api/test   ║
║   Echo:     POST http://localhost:${PORT}/api/echo
╚═══════════════════════════════════════════╝
  `);
});
