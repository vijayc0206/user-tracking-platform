import { Router } from 'express';
import { userRoutes } from './userRoutes.js';
import { eventRoutes } from './eventRoutes.js';
import { sessionRoutes } from './sessionRoutes.js';
import { analyticsRoutes } from './analyticsRoutes.js';
import { authRoutes } from './authRoutes.js';
import { healthRoutes } from './healthRoutes.js';

const router = Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Mount routes
router.use(`${API_PREFIX}/users`, userRoutes);
router.use(`${API_PREFIX}/events`, eventRoutes);
router.use(`${API_PREFIX}/sessions`, sessionRoutes);
router.use(`${API_PREFIX}/analytics`, analyticsRoutes);
router.use(`${API_PREFIX}/auth`, authRoutes);
router.use(`${API_PREFIX}/health`, healthRoutes);

// Root health check (without version prefix)
router.use('/health', healthRoutes);

export { router as routes };
