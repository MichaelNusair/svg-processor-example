import type { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import type { ApiError } from "@svg-processor/shared-types";
import { isAppError, isOperationalError, HttpStatus } from "../errors";
import { createLogger } from "../utils/logger";
import { config } from "../config";

const logger = createLogger("ErrorHandler");

export const notFoundHandler = (req: Request, res: Response): void => {
  const error: ApiError = {
    error: "NotFound",
    message: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: HttpStatus.NOT_FOUND,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };
  res.status(HttpStatus.NOT_FOUND).json(error);
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (isOperationalError(error)) {
    logger.warn("Operational error", { path: req.originalUrl }, error as Error);
  } else {
    logger.error("Unexpected error", error as Error, { path: req.originalUrl });
  }

  const statusCode = isAppError(error) ? error.statusCode : HttpStatus.INTERNAL_SERVER_ERROR;
  const message = isAppError(error)
    ? error.message
    : config.env === "production"
      ? "An unexpected error occurred"
      : (error as Error).message;

  const apiError: ApiError = {
    error: isAppError(error) ? error.name : "InternalServerError",
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  res.status(statusCode).json(apiError);
};
