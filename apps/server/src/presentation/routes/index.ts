import { Router, Request, Response } from 'express';
import { assetRoutes } from './assetRoutes';
import { treasuryRoutes } from './treasuryRoutes';
import { userRoutes } from './userRoutes';
import { alertRoutes } from './alertRoutes';
import { notificationRoutes } from './notificationRoutes';
import { adminRoutes } from './adminRoutes';
import { postgresDatabase } from '../../infrastructure/database/PostgresDatabaseClient';
import { whatsAppService } from '../../infrastructure/notifications/WhatsAppNotificationService';

const router = Router();

router.get('/health', async (_request: Request, response: Response) => {
  try {
    const assetsCountResult = await postgresDatabase.query('SELECT COUNT(*) FROM public.assets');
    const totalAssets = parseInt(assetsCountResult.rows[0]?.count || '0', 10);
    const uptimeSeconds = Math.floor(process.uptime());
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;
    const waStatus = whatsAppService.getStatus();

    response.json({
      status: 'operational',
      service: 'YieldIQ Server',
      database: 'PostgreSQL Connected',
      totalAssetsMonitored: totalAssets,
      uptime: uptimeFormatted,
      uptimeSeconds,
      whatsapp: waStatus.isConnected ? 'Connected' : 'Disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    response.status(500).json({
      status: 'degraded',
      service: 'YieldIQ Server',
      error: (error as Error).message,
      timestamp: new Date().toISOString()
    });
  }
});

router.use('/assets', assetRoutes);
router.use('/treasury', treasuryRoutes);
router.use('/auth', userRoutes);
router.use('/users', userRoutes);
router.use('/alerts', alertRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export const apiRoutes = router;
