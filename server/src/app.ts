import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorMiddleware } from './middleware/error.middleware';
import authRoutes from './modules/auth/auth.routes';
import projectRoutes from './modules/project/project.routes';
import contextRoutes from './modules/context/context.routes';
import githubRoutes from './modules/github/github.routes';
import { githubIntegrationController } from './modules/github/github.controller';

const app = express();

// Security Headers
app.use(helmet());
app.disable('x-powered-by');

// CORS Configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.', code: 'TOO_MANY_REQUESTS' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Request Body Limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:projectId/github', githubRoutes);
app.use('/api/context', contextRoutes);

// Public callback route for GitHub App installation
app.get('/api/github/callback', githubIntegrationController.callback);

app.use(errorMiddleware);

export default app;


