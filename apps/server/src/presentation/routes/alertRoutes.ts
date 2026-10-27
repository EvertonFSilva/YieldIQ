import { Router } from 'express';
import { alertController } from '../controllers/AlertController';
import { authenticateRequest } from '../middlewares/AuthMiddleware';

const router = Router();

router.get('/rules', authenticateRequest, alertController.retrieveRules);
router.post('/rules', authenticateRequest, alertController.upsertRule);
router.delete('/rules/:id', authenticateRequest, alertController.deleteRule);
router.patch('/rules/:id/toggle', authenticateRequest, alertController.toggleRule);
router.get('/history', authenticateRequest, alertController.retrieveHistory);
router.get('/treasury', authenticateRequest, alertController.retrieveTreasuryRules);
router.put('/treasury', authenticateRequest, alertController.updateTreasuryRules);
router.post('/test', authenticateRequest, alertController.sendTestWhatsAppMessage);

export const alertRoutes = router;
