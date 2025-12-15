import { Router } from 'express';
import { healthController } from '../controllers/healthController.js';

const router = Router();

// All health routes are public (for load balancer and monitoring)
router.get('/', healthController.check);
router.get('/detailed', healthController.detailedCheck);
router.get('/ready', healthController.readiness);
router.get('/live', healthController.liveness);

export { router as healthRoutes };
