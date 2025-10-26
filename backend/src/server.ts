import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 4000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
  });
});

// Test route
app.get('/api/test', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from GetOut backend!',
    data: {
      users: 0,
      activities: 0,
    }
  });
});

// Echo route - test POST requests
app.post('/api/echo', (req: Request, res: Response) => {
  res.json({
    message: 'Echo received',
    yourData: req.body,
  });
});

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
