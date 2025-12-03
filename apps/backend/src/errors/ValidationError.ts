import { AppError, HttpStatus } from "./AppError";

export class ValidationError extends AppError {
  readonly statusCode = HttpStatus.BAD_REQUEST;
  readonly isOperational = true;
}

