import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { authenticateRequest } from '../middlewares/AuthMiddleware';

const router = Router();

router.get('/whatsapp/status', authenticateRequest, adminController.retrieveWhatsAppStatus);
router.post('/whatsapp/initialize', authenticateRequest, adminController.initializeWhatsApp);
router.post('/whatsapp/disconnect', authenticateRequest, adminController.disconnectWhatsApp);
router.get('/whatsapp/groups', authenticateRequest, adminController.retrieveWhatsAppGroups);

router.get('/group-alerts', authenticateRequest, adminController.retrieveGroupAlerts);
router.post('/group-alerts', authenticateRequest, adminController.createGroupAlert);
router.delete('/group-alerts/:id', authenticateRequest, adminController.deleteGroupAlert);

router.get('/users', authenticateRequest, adminController.listUsers);
router.patch('/users/:id', authenticateRequest, adminController.updateUserPrivileges);
router.post('/sync-assets', authenticateRequest, adminController.syncAssets);

export const adminRoutes = router;
