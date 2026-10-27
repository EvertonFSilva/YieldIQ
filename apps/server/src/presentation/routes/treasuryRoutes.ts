import { Router } from 'express';
import { treasuryController } from '../controllers/TreasuryController';
import { authenticateRequest } from '../middlewares/AuthMiddleware';

const router = Router();

router.get('/bonds', authenticateRequest, treasuryController.retrieveBonds);

export const treasuryRoutes = router;
