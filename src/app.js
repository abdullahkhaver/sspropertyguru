// src/app.js
import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// Middlewares
import { errorHandler } from './middleware/errorHandler.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';

// Routes
import authRoutes from "./routes/auth.route.js"
import propertyRoutes from "./routes/property.route.js"
import agentRoutes from './routes/agent.route.js';
import userRoutes from './routes/user.route.js';
import franchiseRoutes from './routes/franchise.route.js';
import enquiryRoutes from './routes/enquiry.route.js';
import superAdminDashboardRoutes from "./routes/superAdminDashboard.route.js";
import districtRoutes from "./routes/district.route.js"
import areaRoutes from "./routes/area.route.js"
import franchiseDashboardRoutes from './routes/franchiseDashboard.route.js';
import requirementRoutes from "./routes/requirement.route.js"
import notificationRoutes from './routes/notification.route.js';
import streamRoutes from './routes/stream.route.js';

const app = express();
app.use((req, res, next) => {
  console.log(`[DEBUG] ${req.method} ${req.url}`);
  console.log('[DEBUG] Headers:', JSON.stringify(req.headers));
  next();
});

// Global Middlewares
app.use(express.json());
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('[DEBUG] Malformed JSON Body:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON payload received',
      error: err.message
    });
  }
  next();
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// const allowedOrigins = [
//   'https://sspropertyguru.com',
// ];
const allowedOrigins = [
  'https://sspropertyguru.com',
  'https://www.sspropertyguru.com',
];


app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(helmet());
app.use(morgan('dev'));
// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/properties', propertyRoutes);
app.use('/api/v1/franchise', franchiseRoutes);
app.use('/api/v1/enquiries', enquiryRoutes);
app.use('/api/v1/speradmindashboard', superAdminDashboardRoutes);
app.use('/api/v1/districts', districtRoutes);
app.use('/api/v1/areas', areaRoutes);
app.use('/api/v1/franchisedashboard', franchiseDashboardRoutes);
app.use('/api/v1/requirements', requirementRoutes)
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/stream', streamRoutes);
// 404 Handler
app.use(notFoundHandler);
// Error Handler
app.use(errorHandler);

// Deployment timestamp: 2026-03-22T13:33:46
export default app;
