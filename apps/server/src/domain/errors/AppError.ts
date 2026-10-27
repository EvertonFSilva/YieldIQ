export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public readonly isOperational = true;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly statusCode = 400;
  constructor(message: string = 'Invalid request parameters') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  public readonly statusCode = 401;
  constructor(message: string = 'Authentication required or invalid credentials') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  public readonly statusCode = 403;
  constructor(message: string = 'Forbidden resource access') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  public readonly statusCode = 409;
  constructor(message: string = 'Conflict with the current state of the resource') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class ExternalServiceError extends AppError {
  public readonly statusCode = 502;
  constructor(message: string = 'External provider communication failure') {
    super(message);
    this.name = 'ExternalServiceError';
  }
}
