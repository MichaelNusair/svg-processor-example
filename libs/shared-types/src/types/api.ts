import type { DesignStatus } from "./design";

export interface ApiError {
  readonly error: string;
  readonly message: string;
  readonly statusCode: number;
  readonly timestamp: string;
  readonly path?: string;
}

export interface UploadDesignResponse {
  readonly id: string;
  readonly filename: string;
  readonly status: DesignStatus;
  readonly createdAt: string;
  readonly message: string;
}
