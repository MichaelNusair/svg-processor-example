import { AppError, HttpStatus } from "./AppError";

export class NotFoundError extends AppError {
  readonly statusCode = HttpStatus.NOT_FOUND;
  readonly isOperational = true;

  constructor(resource: string, identifier?: string) {
    super(identifier ? `${resource} '${identifier}' not found` : `${resource} not found`);
  }
}

