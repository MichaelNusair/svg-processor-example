import type {
  Design,
  DesignListItem,
  UploadDesignResponse,
} from '@svg-processor/shared-types';
import type multer from 'multer';
import {
  designRepository,
  CreateDesignData,
  UpdateDesignData,
} from '../repositories/design.repository';
import { svgParserService } from './svgParser';
import { fileService } from './file.service';
import { createLogger } from '../utils/logger';
import type { IDesign } from '../models/Design';

const logger = createLogger('DesignService');

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
  async create(file: multer.File): Promise<UploadDesignResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const fileFilename: string = file.filename;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const fileOriginalname: string = file.originalname;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const filePath: string = file.path;
    const data: CreateDesignData = {
      filename: fileFilename,
      originalFilename: fileOriginalname,
      filePath,
      status: 'processing',
    };

    const design = await designRepository.create(data);
    const designId = design._id.toString();

    void this.processAsync(designId, filePath);

    return {
      id: designId,
      filename: design.originalFilename,
      status: design.status,
      createdAt: design.createdAt.toISOString(),
      message: 'File uploaded successfully. Processing started.',
    };
  }

  private async processAsync(
    designId: string,
    filePath: string
  ): Promise<void> {
    try {
      const parsed = await svgParserService.parseFile(filePath);

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
      logger.info('Design processed', { designId });
    } catch (error) {
      logger.error('Processing failed', error as Error, { designId });
      await designRepository.update(designId, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
    }
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
  }
}

export const designService = new DesignService();
