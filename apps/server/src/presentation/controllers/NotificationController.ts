import { Request, Response, NextFunction } from 'express';
import { ManageNotificationsUseCase } from '../../application/usecases/ManageNotificationsUseCase';
import { UnauthorizedError, ForbiddenError } from '../../domain/errors/AppError';

export class NotificationController {
  private readonly manageNotificationsUseCase = new ManageNotificationsUseCase();

  public retrieveNotifications = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const pageNumber = parseInt(request.query.page as string, 10) || 1;
      const itemsPerPage = parseInt(request.query.limit as string, 10) || 20;

      const result = await this.manageNotificationsUseCase.retrieveNotifications(
        currentUserId,
        pageNumber,
        itemsPerPage
      );

      response.json({
        success: true,
        data: result
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrieveUnreadCount = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const count = await this.manageNotificationsUseCase.retrieveUnreadCount(currentUserId);
      response.json({
        success: true,
        data: { unreadCount: count }
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public markAllAsRead = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      await this.manageNotificationsUseCase.markAllAsRead(currentUserId);
      response.json({
        success: true,
        data: null
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public markAsRead = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const notificationIdentifier = request.params.id;
      await this.manageNotificationsUseCase.markAsRead(currentUserId, notificationIdentifier);
      response.json({
        success: true,
        data: null
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public createBroadcast = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const userPrivilege = request.user?.privilege;
      if (userPrivilege !== 'admin') {
        throw new ForbiddenError('Administrative privilege required');
      }

      const { title, message } = request.body;
      await this.manageNotificationsUseCase.createBroadcastNotification(title, message);

      response.status(201).json({
        success: true,
        data: { message: 'Broadcast notification distributed successfully' }
      });
    } catch (error) {
      nextStep(error);
    }
  };
}

export const notificationController = new NotificationController();
