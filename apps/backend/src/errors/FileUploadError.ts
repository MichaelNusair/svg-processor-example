import { AppError, HttpStatus } from "./AppError";

export class FileUploadError extends AppError {
  readonly statusCode = HttpStatus.BAD_REQUEST;
  readonly isOperational = true;
}

