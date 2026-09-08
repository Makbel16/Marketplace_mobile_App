import path from 'path';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/environment';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { sendSuccess } from './utils/apiResponse';

const app: Application = express();

// Security HTTP headers with relaxed CSP for web admin portal
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: config.clientUrl === '*' ? true : config.clientUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// HTTP request logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global rate limiting
app.use(generalLimiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  return sendSuccess(res, 'API is running', {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: config.nodeEnv,
  });
});

import authRoutes from './routes/authRoutes';
import categoryRoutes from './routes/categoryRoutes';
import productRoutes from './routes/productRoutes';
import uploadRoutes from './routes/uploadRoutes';
import cartRoutes from './routes/cartRoutes';
import orderRoutes from './routes/orderRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import reviewRoutes from './routes/reviewRoutes';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);

// Admin Web Dashboard
const publicPath = path.join(__dirname, '../public');
app.use(express.static(publicPath));
app.get('/admin', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'admin/index.html'));
});
app.get('/admin/*', (req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'admin/index.html'));
});

// 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
