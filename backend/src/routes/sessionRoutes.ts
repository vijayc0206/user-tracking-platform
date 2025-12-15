import { Router } from 'express';
import { sessionController } from '../controllers/sessionController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { eventLimiter } from '../middlewares/rateLimiter.js';
import { UserRole } from '../types/index.js';

const router = Router();

// Public routes - session management (with rate limiting)
router.post('/', eventLimiter, sessionController.create);
router.post('/:sessionId/end', eventLimiter, sessionController.endSession);

// Protected routes - require authentication
router.use(authenticate);

// Session search and statistics
router.get('/', sessionController.search);
router.get('/active', sessionController.getActiveSessions);
router.get('/stats', sessionController.getStats);

// Session by ID
router.get('/:sessionId', sessionController.getBySessionId);

// Sessions by user
router.get('/user/:userId', sessionController.getByUserId);

// Admin only - expire inactive sessions
router.post(
  '/expire-inactive',
  authorize(UserRole.ADMIN),
  sessionController.expireInactiveSessions
);

export { router as sessionRoutes };
