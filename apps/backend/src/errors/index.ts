import { AppError } from './AppError';
export { AppError, HttpStatus, type HttpStatusCode } from './AppError';
export { NotFoundError } from './NotFoundError';
export { ValidationError } from './ValidationError';
export { FileUploadError } from './FileUploadError';
export { SVGParseError } from './SVGParseError';

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isOperationalError(error: unknown): boolean {
  return isAppError(error) && error.isOperational;
}
