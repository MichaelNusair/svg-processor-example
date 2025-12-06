import type {
  Design,
  DesignListItem,
  UploadDesignResponse,
} from '@svg-processor/shared-types';
import {
  designRepository,
  CreateDesignData,
  UpdateDesignData,
} from '../repositories/design.repository';
import { svgParserService } from './svgParser';
import { fileService } from './file.service';
import { createLogger, metrics } from '../utils/logger';
import type { IDesign } from '../models/Design';

const logger = createLogger('DesignService');

const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
};

/**
 * Sleep for a specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay for exponential backoff with jitter.
 */
function getRetryDelay(attempt: number): number {
  const baseDelay =
    RETRY_CONFIG.initialDelayMs *
    Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.3 * baseDelay; // Add up to 30% jitter
  return Math.min(baseDelay + jitter, RETRY_CONFIG.maxDelayMs);
}

function toDesignDTO(design: IDesign): Design {
  return {
    _id: design._id.toString(),
    filename: design.filename,
    originalFilename: design.originalFilename,
    filePath: design.filePath,
    status: design.status,
    svgWidth: design.svgWidth,
    svgHeight: design.svgHeight,
    items: design.items,
    itemsCount: design.itemsCount,
    coverageRatio: design.coverageRatio,
    issues: design.issues,
    errorMessage: design.errorMessage,
    createdAt: design.createdAt.toISOString(),
    updatedAt: design.updatedAt.toISOString(),
  };
}

function toListItemDTO(design: IDesign): DesignListItem {
  return {
    _id: design._id.toString(),
    filename: design.filename,
    originalFilename: design.originalFilename,
    status: design.status,
    itemsCount: design.itemsCount,
    coverageRatio: design.coverageRatio,
    issues: design.issues,
    createdAt: design.createdAt.toISOString(),
  };
}

class DesignService {
  async create(file: Express.Multer.File): Promise<UploadDesignResponse> {
    // multer.File type definitions are incomplete, but these properties are guaranteed by multer
    const fileFilename: string = file.filename;
    const fileOriginalname: string = file.originalname;
    const filePath: string = file.path;
    const data: CreateDesignData = {
      filename: fileFilename,
      originalFilename: fileOriginalname,
      filePath,
      status: 'processing',
    };

    const design = await designRepository.create(data);
    const designId = design._id.toString();

    // Record upload metric
    metrics.increment('designs_uploaded_total');

    // Start async processing with retry support
    void this.processWithRetry(designId, filePath);

    return {
      id: designId,
      filename: design.originalFilename,
      status: design.status,
      createdAt: design.createdAt.toISOString(),
      message: 'File uploaded successfully. Processing started.',
    };
  }

  /**
   * Process SVG with automatic retry on transient failures.
   * Uses exponential backoff with jitter to avoid thundering herd.
   */
  private async processWithRetry(
    designId: string,
    filePath: string
  ): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        await this.processAsync(designId, filePath, attempt);
        return; // Success - exit retry loop
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        logger.warn(`Processing attempt ${String(attempt)} failed`, {
          designId,
          attempt,
          maxAttempts: RETRY_CONFIG.maxAttempts,
          error: lastError.message,
        });

        // Don't retry if this is the last attempt
        if (attempt < RETRY_CONFIG.maxAttempts) {
          const delay = getRetryDelay(attempt);
          logger.info(`Retrying in ${String(Math.round(delay))}ms`, {
            designId,
            attempt,
          });
          await sleep(delay);
        }
      }
    }

    // All retries exhausted - mark as permanent failure
    logger.error('Processing failed after all retries', lastError, {
      designId,
      attempts: RETRY_CONFIG.maxAttempts,
    });

    metrics.increment('designs_processing_failed_total');

    await designRepository.update(designId, {
      status: 'error',
      errorMessage: `Processing failed after ${String(RETRY_CONFIG.maxAttempts)} attempts: ${lastError?.message ?? 'Unknown error'}`,
    });
  }

  private async processAsync(
    designId: string,
    filePath: string,
    attempt = 1
  ): Promise<void> {
    const startTime = performance.now();

    const parsed = await metrics.timeAsync(
      'svg_parsing_duration_ms',
      () => svgParserService.parseFile(filePath),
      { designId }
    );

    const updateData: UpdateDesignData = {
      status: 'completed',
      svgWidth: parsed.svgWidth,
      svgHeight: parsed.svgHeight,
      items: [...parsed.items],
      itemsCount: parsed.itemsCount,
      coverageRatio: parsed.coverageRatio,
      issues: [...parsed.issues],
    };

    await designRepository.update(designId, updateData);

    const duration = performance.now() - startTime;

    logger.info('Design processed', {
      designId,
      attempt,
      durationMs: Math.round(duration),
      itemsCount: parsed.itemsCount,
      issues: parsed.issues,
    });

    metrics.increment('designs_processing_succeeded_total');
    metrics.histogram('designs_processing_duration_ms', duration);
  }

  /**
   * Reprocess a design that previously failed.
   * Useful for manual recovery or scheduled retry jobs.
   */
  async reprocess(id: string): Promise<void> {
    const design = await designRepository.findById(id);

    if (design.status !== 'error') {
      logger.warn('Attempted to reprocess non-error design', {
        designId: id,
        currentStatus: design.status,
      });
      return;
    }

    // Reset to processing status
    await designRepository.update(id, {
      status: 'processing',
      errorMessage: undefined,
    });

    // Start processing with retry
    void this.processWithRetry(id, design.filePath);
  }

  async getById(id: string): Promise<Design> {
    const design = await designRepository.findById(id);
    return toDesignDTO(design);
  }

  async list(): Promise<DesignListItem[]> {
    const designs = await designRepository.findAll();
    return designs.map(toListItemDTO);
  }

  async delete(id: string): Promise<void> {
    const design = await designRepository.findById(id);
    await fileService.deleteFile(design.filePath);
    await designRepository.delete(id);

    metrics.increment('designs_deleted_total');
  }
}

export const designService = new DesignService();
