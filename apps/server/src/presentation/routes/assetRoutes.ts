import { Router } from 'express';
import { assetController } from '../controllers/AssetController';
import { authenticateRequest } from '../middlewares/AuthMiddleware';

const router = Router();

router.get('/', authenticateRequest, assetController.listAssets);
router.get('/price/:ticker', authenticateRequest, assetController.retrievePrice);
router.get('/dividends/:ticker', authenticateRequest, assetController.retrieveDividends);
router.get('/documents/:ticker', authenticateRequest, assetController.retrieveDocuments);
router.get('/summary/:ticker', authenticateRequest, assetController.retrieveSummary);

export const assetRoutes = router;
