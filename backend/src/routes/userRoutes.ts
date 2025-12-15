import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../types/index.js';

const router = Router();

// Public routes (none for users)

// Protected routes - require authentication
router.use(authenticate);

// User search and listing
router.get('/', userController.search);
router.get('/stats', userController.getStats);
router.get('/top', userController.getTopUsers);

// User by visitor ID
router.get('/:visitorId', userController.getByVisitorId);
router.put('/:visitorId', userController.update);
router.get('/:visitorId/journey', userController.getJourney);

// Tags management
router.post('/:visitorId/tags', userController.addTags);
router.delete('/:visitorId/tags', userController.removeTags);

// Segments management
router.post('/:visitorId/segments', userController.addToSegments);

// Admin only - delete user
router.delete(
  '/:visitorId',
  authorize(UserRole.ADMIN),
  userController.delete
);

export { router as userRoutes };
