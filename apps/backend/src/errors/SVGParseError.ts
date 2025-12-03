import { AppError, HttpStatus } from "./AppError";

export class SVGParseError extends AppError {
  readonly statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
  readonly isOperational = true;
}

