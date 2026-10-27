import 'reflect-metadata';
import express, { Express, Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { environment } from './config/env';
import { LoggerUtils } from './infrastructure/utils/Logger';
import { apiRoutes } from './presentation/routes';
import { handleCentralizedError } from './presentation/middlewares/ErrorHandler';
import { whatsAppService } from './infrastructure/notifications/WhatsAppNotificationService';
import { alertOrchestrator } from './infrastructure/workers/AlertOrchestrator';

const application: Express = express();

application.use(compression());
application.use(express.json());

application.use((request: Request, response: Response, nextFunction: NextFunction) => {
  const requestStartTime = Date.now();
  response.on('finish', () => {
    const durationInMilliseconds = Date.now() - requestStartTime;
    LoggerUtils.info(`${request.method} ${request.originalUrl} [${response.statusCode}] - ${durationInMilliseconds}ms`);
  });
  nextFunction();
});

application.use((request: Request, response: Response, nextFunction: NextFunction) => {
  response.header('Access-Control-Allow-Origin', environment.CORS_ORIGIN);
  response.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-TOKEN'
  );
  if (request.method === 'OPTIONS') {
    response.sendStatus(200);
    return;
  }
  nextFunction();
});

application.use('/api', apiRoutes);
application.use('/', apiRoutes);

application.use(handleCentralizedError);

application.listen(environment.PORT, () => {
  LoggerUtils.info(`YieldIQ Server active on port ${environment.PORT} [${environment.NODE_ENV}]`);
  LoggerUtils.info('Active providers: B3, CVM FNet, Yahoo Finance, Treasury Direct');

  if (environment.WHATSAPP_AUTO_START) {
    whatsAppService.initialize().catch((error) => {
      LoggerUtils.error('Failed to initialize WhatsApp notification service', error, 'ServerStartup');
    });
    alertOrchestrator.start();
  }
});
