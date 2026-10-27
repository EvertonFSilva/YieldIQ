import { Router } from 'express';
import { userController } from '../controllers/UserController';
import { authenticateRequest } from '../middlewares/AuthMiddleware';

const router = Router();

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authenticateRequest, userController.retrieveProfile);
router.put('/profile/username', authenticateRequest, userController.updateUsername);
router.put('/profile/phone', authenticateRequest, userController.updatePhoneNumber);
router.put('/profile/whatsapp', authenticateRequest, userController.updateWhatsAppPreference);
router.put('/profile/password', authenticateRequest, userController.updatePassword);
router.post('/profile/apikey', authenticateRequest, userController.regenerateApiKey);
router.get('/profile/usage', authenticateRequest, userController.retrieveTelemetryUsage);

export const userRoutes = router;
