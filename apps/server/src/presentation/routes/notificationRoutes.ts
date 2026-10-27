import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { authenticateRequest } from '../middlewares/AuthMiddleware';

const router = Router();

router.get('/', authenticateRequest, notificationController.retrieveNotifications);
router.get('/unread-count', authenticateRequest, notificationController.retrieveUnreadCount);
router.post('/read', authenticateRequest, notificationController.markAllAsRead);
router.post('/:id/read', authenticateRequest, notificationController.markAsRead);
router.post('/create', authenticateRequest, notificationController.createBroadcast);

export const notificationRoutes = router;
