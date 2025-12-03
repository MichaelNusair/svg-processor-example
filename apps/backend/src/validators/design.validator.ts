import type { Request } from "express";
import { ValidationError, FileUploadError } from "../errors";
import { config } from "../config";

export function validateFileUpload(req: Request): void {
  if (!req.file) {
    throw new FileUploadError("No file uploaded");
  }

  const extension = req.file.originalname.toLowerCase().split(".").pop();
  if (!extension || !config.upload.allowedExtensions.includes(`.${extension}`)) {
    throw new FileUploadError(`Invalid file type. Allowed: ${config.upload.allowedExtensions.join(", ")}`);
  }
}

export function validateObjectId(id: string): void {
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    throw new ValidationError("Invalid ID format");
  }
}
