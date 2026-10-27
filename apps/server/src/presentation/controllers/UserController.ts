import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../application/usecases/RegisterUserUseCase';
import { AuthenticateUserUseCase } from '../../application/usecases/AuthenticateUserUseCase';
import { RetrieveUserProfileUseCase } from '../../application/usecases/RetrieveUserProfileUseCase';
import { UpdateUserProfileUseCase } from '../../application/usecases/UpdateUserProfileUseCase';
import { RegenerateApiKeyUseCase } from '../../application/usecases/RegenerateApiKeyUseCase';
import { RetrieveTelemetryUsageUseCase } from '../../application/usecases/RetrieveTelemetryUsageUseCase';
import { UnauthorizedError } from '../../domain/errors/AppError';

export class UserController {
  private readonly registerUserUseCase = new RegisterUserUseCase();
  private readonly authenticateUserUseCase = new AuthenticateUserUseCase();
  private readonly retrieveUserProfileUseCase = new RetrieveUserProfileUseCase();
  private readonly updateUserProfileUseCase = new UpdateUserProfileUseCase();
  private readonly regenerateApiKeyUseCase = new RegenerateApiKeyUseCase();
  private readonly retrieveTelemetryUsageUseCase = new RetrieveTelemetryUsageUseCase();

  public register = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const registrationResult = await this.registerUserUseCase.execute(request.body);
      response.status(201).json({
        success: true,
        data: registrationResult
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public login = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const { username, identifier, password } = request.body;
      const targetIdentifier = identifier || username;
      const authenticationResult = await this.authenticateUserUseCase.execute({
        identifier: targetIdentifier,
        password
      });

      response.json({
        success: true,
        data: authenticationResult
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrieveProfile = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const profile = await this.retrieveUserProfileUseCase.execute(currentUserId);
      response.json({
        success: true,
        data: profile
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public updateUsername = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { username } = request.body;
      const updatedUsername = await this.updateUserProfileUseCase.updateUsername(currentUserId, username);

      response.json({
        success: true,
        data: { username: updatedUsername }
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public updatePhoneNumber = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { phone, phoneNumber } = request.body;
      const targetPhone = phoneNumber || phone;
      const updatedPhone = await this.updateUserProfileUseCase.updatePhoneNumber(currentUserId, targetPhone);

      response.json({
        success: true,
        data: { phoneNumber: updatedPhone }
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public updateWhatsAppPreference = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { enabled, isWhatsAppEnabled } = request.body;
      const flag = enabled !== undefined ? enabled : isWhatsAppEnabled;
      const updatedPreference = await this.updateUserProfileUseCase.updateWhatsAppPreference(currentUserId, flag);

      response.json({
        success: true,
        data: { isWhatsAppEnabled: updatedPreference }
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public updatePassword = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const { currentPassword, newPassword } = request.body;
      await this.updateUserProfileUseCase.updatePassword(currentUserId, currentPassword, newPassword);

      response.json({
        success: true,
        data: { message: 'Password updated successfully' }
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public regenerateApiKey = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const newApiKey = await this.regenerateApiKeyUseCase.execute(currentUserId);
      response.json({
        success: true,
        data: { apiKey: newApiKey }
      });
    } catch (error) {
      nextStep(error);
    }
  };

  public retrieveTelemetryUsage = async (
    request: Request,
    response: Response,
    nextStep: NextFunction
  ): Promise<void> => {
    try {
      const currentUserId = request.user?.id;
      if (!currentUserId) {
        throw new UnauthorizedError('User authentication required');
      }

      const periodString = (request.query.period as string) || 'month';
      const usageSummary = await this.retrieveTelemetryUsageUseCase.execute(currentUserId, periodString);

      response.json({
        success: true,
        data: usageSummary
      });
    } catch (error) {
      nextStep(error);
    }
  };
}

export const userController = new UserController();
