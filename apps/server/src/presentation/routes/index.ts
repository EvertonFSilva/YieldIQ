import { Router, Request, Response } from 'express';
import { assetRoutes } from './assetRoutes';
import { treasuryRoutes } from './treasuryRoutes';
import { userRoutes } from './userRoutes';
import { alertRoutes } from './alertRoutes';
import { notificationRoutes } from './notificationRoutes';
import { adminRoutes } from './adminRoutes';

const router = Router();

router.get('/health', (_request: Request, response: Response) => {
  response.json({
    status: 'ok',
    service: 'YieldIQ Server',
    timestamp: new Date().toISOString()
  });
});

router.use('/assets', assetRoutes);
router.use('/funds', assetRoutes);
router.use('/treasury', treasuryRoutes);
router.use('/auth', userRoutes);
router.use('/users', userRoutes);
router.use('/alerts', alertRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export const apiRoutes = router;
