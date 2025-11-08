import { Router, Request, Response } from 'express';
import * as version from '../version';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running!',
    timestamp: new Date().toISOString(),
  });
});

router.get('/version', (req: Request, res: Response) => {
  res.json({
    version: version.APP_VERSION,
    buildTimestamp: version.BUILD_TIMESTAMP,
    versionString: version.getVersionString(),
  });
});

router.get('/api/test', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from GetOut backend!',
    timestamp: new Date().toISOString(),
  });
});

router.post('/api/echo', (req: Request, res: Response) => {
  res.json({
    message: 'Echo received',
    yourData: req.body,
    timestamp: new Date().toISOString(),
  });
});

export default router;
