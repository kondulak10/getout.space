import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import testRoutes from './routes/test.routes';
import stravaRoutes from './routes/strava.routes';
import webhookRoutes from './routes/webhook.routes';

const PORT = process.env.PORT || 4000;

const app = express();

// Connect to MongoDB
connectDatabase();

// Middleware
app.use(cors());
app.use(express.json());

// Root HTML page
app.get('/', (req, res) => {
	res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GetOut.space API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 800px;
            width: 100%;
            padding: 40px;
        }
        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 1.1rem;
        }
        .status {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #10b981;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 30px;
        }
        .status-dot {
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 1.3rem;
            margin-bottom: 15px;
            color: #333;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .endpoint {
            background: #f7fafc;
            border-left: 4px solid #667eea;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 4px;
        }
        .endpoint-method {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 0.75rem;
            margin-right: 10px;
        }
        .get { background: #10b981; color: white; }
        .post { background: #3b82f6; color: white; }
        .endpoint-path {
            font-family: 'Courier New', monospace;
            color: #4a5568;
        }
        .endpoint-desc {
            margin-top: 8px;
            color: #718096;
            font-size: 0.9rem;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            color: #a0aec0;
            font-size: 0.9rem;
        }
        .link {
            color: #667eea;
            text-decoration: none;
            font-weight: 600;
        }
        .link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 GetOut.space API</h1>
        <p class="subtitle">Strava Integration Backend</p>

        <div class="status">
            <span class="status-dot"></span>
            Server Running
        </div>

        <div class="section">
            <h2 class="section-title">📍 API Endpoints</h2>

            <div class="endpoint">
                <span class="endpoint-method get">GET</span>
                <span class="endpoint-path">/health</span>
                <div class="endpoint-desc">Health check endpoint</div>
            </div>

            <div class="endpoint">
                <span class="endpoint-method get">GET</span>
                <span class="endpoint-path">/api/test</span>
                <div class="endpoint-desc">Test endpoint for backend connectivity</div>
            </div>

            <div class="endpoint">
                <span class="endpoint-method post">POST</span>
                <span class="endpoint-path">/api/echo</span>
                <div class="endpoint-desc">Echo endpoint for testing POST requests</div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">🏃 Strava Endpoints</h2>

            <div class="endpoint">
                <span class="endpoint-method get">GET</span>
                <span class="endpoint-path">/api/strava/auth</span>
                <div class="endpoint-desc">Get Strava OAuth authorization URL</div>
            </div>

            <div class="endpoint">
                <span class="endpoint-method post">POST</span>
                <span class="endpoint-path">/api/strava/callback</span>
                <div class="endpoint-desc">Exchange authorization code for tokens</div>
            </div>

            <div class="endpoint">
                <span class="endpoint-method get">GET</span>
                <span class="endpoint-path">/api/strava/activities</span>
                <div class="endpoint-desc">Fetch authenticated user's activities</div>
            </div>

            <div class="endpoint">
                <span class="endpoint-method get">GET</span>
                <span class="endpoint-path">/api/strava/activities/:id</span>
                <div class="endpoint-desc">Get detailed information for a specific activity</div>
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">🔔 Webhook Endpoints</h2>

            <div class="endpoint">
                <span class="endpoint-method get">GET</span>
                <span class="endpoint-path">/api/strava/webhook</span>
                <div class="endpoint-desc">Webhook verification endpoint (used by Strava)</div>
            </div>

            <div class="endpoint">
                <span class="endpoint-method post">POST</span>
                <span class="endpoint-path">/api/strava/webhook</span>
                <div class="endpoint-desc">Receive webhook events from Strava</div>
            </div>

            <div class="endpoint">
                <span class="endpoint-method get">GET</span>
                <span class="endpoint-path">/api/strava/events</span>
                <div class="endpoint-desc">Server-Sent Events stream for real-time activity updates</div>
            </div>
        </div>

        <div class="footer">
            <p>Built with Express.js • TypeScript • Strava API</p>
            <p style="margin-top: 10px;">
                <a href="https://developers.strava.com" class="link" target="_blank">Strava API Docs</a>
            </p>
        </div>
    </div>
</body>
</html>
	`);
});

// Routes
app.use(testRoutes);
app.use(stravaRoutes);
app.use(webhookRoutes);

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
