import { Router, Request, Response } from 'express';

const router = Router();

// Health check
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
  });
});

// Test route
router.get('/api/test', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from GetOut backend!',
    timestamp: new Date().toISOString(),
  });
});

// Echo route - test POST requests
router.post('/api/echo', (req: Request, res: Response) => {
  res.json({
    message: 'Echo received',
    yourData: req.body,
    timestamp: new Date().toISOString(),
  });
});

export default router;
