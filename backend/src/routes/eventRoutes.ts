import { Router } from 'express';
import { eventController } from '../controllers/eventController.js';
import { authenticate } from '../middlewares/auth.js';
import { eventLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Public routes - event ingestion (with rate limiting)
router.post('/', eventLimiter, eventController.ingest);
router.post('/batch', eventLimiter, eventController.ingestBatch);

// Get event types (public)
router.get('/types', eventController.getEventTypes);

// Protected routes - require authentication
router.use(authenticate);

// Event search and statistics
router.get('/', eventController.search);
router.get('/stats', eventController.getStats);
router.get('/daily-stats', eventController.getDailyStats);
router.get('/page-views', eventController.getPageViewStats);

// Event by ID
router.get('/:eventId', eventController.getById);

// Events by user or session
router.get('/user/:userId', eventController.getByUserId);
router.get('/session/:sessionId', eventController.getBySessionId);

export { router as eventRoutes };
