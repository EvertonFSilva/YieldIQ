import { Router } from 'express';
import { assetController } from '../controllers/AssetController';
import { optionalAuthenticateRequest } from '../middlewares/AuthMiddleware';

const router = Router();

router.get('/', optionalAuthenticateRequest, assetController.listAssets);
router.get('/price/:ticker', optionalAuthenticateRequest, assetController.retrievePrice);
router.get('/dividends/:ticker', optionalAuthenticateRequest, assetController.retrieveDividends);
router.get('/documents/:ticker', optionalAuthenticateRequest, assetController.retrieveDocuments);
router.get('/summary/:ticker', optionalAuthenticateRequest, assetController.retrieveSummary);

export const assetRoutes = router;
