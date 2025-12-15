import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import { UserRole } from '../types/index.js';

const router = Router();

// Public routes with rate limiting
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authLimiter, authController.refreshToken);

// Protected routes - require authentication
router.use(authenticate);

// Profile management
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.post('/change-password', authController.changePassword);

// Admin only routes
router.get(
  '/users',
  authorize(UserRole.ADMIN),
  authController.getAllUsers
);

router.put(
  '/users/:userId/role',
  authorize(UserRole.ADMIN),
  authController.updateRole
);

router.post(
  '/users/:userId/deactivate',
  authorize(UserRole.ADMIN),
  authController.deactivateUser
);

router.post(
  '/users/:userId/activate',
  authorize(UserRole.ADMIN),
  authController.activateUser
);

export { router as authRoutes };
