import { ERROR_MESSAGES } from '../constants/app';

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  public readonly type: string;
  public readonly statusCode?: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    type: string = 'UNKNOWN_ERROR',
    statusCode?: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Network error class
 */
export class NetworkError extends AppError {
  constructor(message: string = ERROR_MESSAGES.network, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode);
  }
}

/**
 * Authentication error class
 */
export class AuthError extends AppError {
  constructor(message: string = ERROR_MESSAGES.unauthorized, statusCode: number = 401) {
    super(message, 'AUTH_ERROR', statusCode);
  }
}

/**
 * Validation error class
 */
export class ValidationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.validation, statusCode: number = 400) {
    super(message, 'VALIDATION_ERROR', statusCode);
  }
}

/**
 * API error class
 */
export class ApiError extends AppError {
  constructor(message: string, statusCode: number, type: string = 'API_ERROR') {
    super(message, type, statusCode);
  }
}

/**
 * Parse HTTP error and return appropriate error instance
 */
export const parseHttpError = (error: any): AppError => {
  // Handle network errors
  if (!error.response) {
    return new NetworkError();
  }

  const { status, data } = error.response;
  let message: string = ERROR_MESSAGES.generic;

  // Extract error message from response
  if (data) {
    if (typeof data === 'string') {
      message = data;
    } else if (data.message) {
      message = data.message;
    } else if (data.detail) {
      message = data.detail;
    } else if (data.error) {
      message = data.error;
    } else if (data.errors && Array.isArray(data.errors)) {
      message = data.errors.join(', ');
    }
  }

  // Return appropriate error type based on status code
  switch (status) {
    case 400:
      return new ValidationError(message, status);
    case 401:
      return new AuthError(message, status);
    case 403:
      return new ApiError(ERROR_MESSAGES.forbidden, status, 'FORBIDDEN_ERROR');
    case 404:
      return new ApiError(ERROR_MESSAGES.notFound, status, 'NOT_FOUND_ERROR');
    case 408:
      return new ApiError(ERROR_MESSAGES.timeout, status, 'TIMEOUT_ERROR');
    case 500:
    case 502:
    case 503:
    case 504:
      return new ApiError(ERROR_MESSAGES.serverError, status, 'SERVER_ERROR');
    default:
      return new ApiError(message, status);
  }
};

/**
 * Handle errors in async functions with try-catch
 */
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  errorCallback?: (error: AppError) => void
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    const appError = error instanceof AppError ? error : parseHttpError(error);

    if (errorCallback) {
      errorCallback(appError);
    } else {
      console.error('Unhandled error:', appError);
    }

    return null;
  }
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: delay = baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

/**
 * Check if error is recoverable (network errors, timeouts, etc.)
 */
export const isRecoverableError = (error: AppError): boolean => {
  const recoverableTypes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'SERVER_ERROR'];
  return recoverableTypes.includes(error.type);
};

/**
 * Log error with context information
 */
export const logError = (
  error: Error,
  context: Record<string, any> = {},
  level: 'error' | 'warn' | 'info' = 'error'
): void => {
  const errorInfo = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    context,
  };

  if (error instanceof AppError) {
    Object.assign(errorInfo, {
      type: error.type,
      statusCode: error.statusCode,
      isOperational: error.isOperational,
    });
  }

  // In development, log to console
  if (__DEV__) {
    console[level]('Error logged:', errorInfo);
  }

  // In production, you might want to send to a logging service
  // Example: sendToLoggingService(errorInfo);
};

/**
 * Create a safe function wrapper that catches and handles errors
 */
export const createSafeFunction = <T extends (...args: any[]) => any>(
  fn: T,
  fallbackValue?: ReturnType<T>,
  onError?: (error: Error) => void
): T => {
  return ((...args: Parameters<T>): ReturnType<T> => {
    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          const appError = error instanceof AppError ? error : new AppError(error.message);
          logError(appError);

          if (onError) {
            onError(appError);
          }

          return fallbackValue;
        }) as ReturnType<T>;
      }

      return result;
    } catch (error) {
      const appError = error instanceof AppError ? error : new AppError((error as Error).message);
      logError(appError);

      if (onError) {
        onError(appError);
      }

      return fallbackValue as ReturnType<T>;
    }
  }) as T;
};