import { Router } from 'express';
import { treasuryController } from '../controllers/TreasuryController';
import { optionalAuthenticateRequest } from '../middlewares/AuthMiddleware';

const router = Router();

router.get('/bonds', optionalAuthenticateRequest, treasuryController.retrieveBonds);

export const treasuryRoutes = router;
