import { Router } from 'express';
import { analyticsController } from '../controllers/analyticsController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

// Dashboard and overview
router.get('/dashboard', analyticsController.getDashboard);
router.get('/overview', analyticsController.getOverview);
router.get('/realtime', analyticsController.getRealtime);

// User insights
router.get('/user-insights', analyticsController.getUserInsights);

// Conversion analytics
router.get('/conversions', analyticsController.getConversions);

// Geographic and device analytics
router.get('/geographic', analyticsController.getGeographic);
router.get('/devices', analyticsController.getDevices);

// Export summary
router.get('/summary', analyticsController.getSummary);

export { router as analyticsRoutes };
