import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { Express } from 'express';

// Must mock before importing the module under test
vi.mock('../repositories/design.repository');
vi.mock('./svgParser');
vi.mock('./file.service');

import { designService } from './design.service';
import { designRepository } from '../repositories/design.repository';
import { fileService } from './file.service';
import type { IDesign } from '../models/Design';
import mongoose from 'mongoose';

describe('DesignService', () => {
  const mockDesignId = '507f1f77bcf86cd799439011';

  const mockDesign: Partial<IDesign> = {
    _id: new mongoose.Types.ObjectId(mockDesignId),
    filename: 'test-file.svg',
    originalFilename: 'original.svg',
    filePath: '/uploads/test-file.svg',
    status: 'completed',
    svgWidth: 800,
    svgHeight: 600,
    items: [
      {
        x: 10,
        y: 10,
        width: 100,
        height: 100,
        fill: '#FF0000',
        isOutOfBounds: false,
      },
    ],
    itemsCount: 1,
    coverageRatio: 0.0208,
    issues: [],
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create a design record with processing status', async () => {
      const mockFile: Express.Multer.File = {
        filename: 'uuid-test.svg',
        originalname: 'test.svg',
        path: '/uploads/uuid-test.svg',
        fieldname: 'file',
        encoding: '7bit',
        mimetype: 'image/svg+xml',
        size: 1234,
        destination: '/uploads',
        buffer: Buffer.from(''),
        stream: null as unknown as ReturnType<
          typeof import('fs').createReadStream
        >,
      };

      const createdDesign = {
        ...mockDesign,
        _id: new mongoose.Types.ObjectId(),
        status: 'processing',
        originalFilename: 'test.svg',
      };

      vi.mocked(designRepository.create).mockResolvedValue(
        createdDesign as IDesign
      );

      const result = await designService.create(mockFile);

      expect(designRepository.create).toHaveBeenCalledWith({
        filename: 'uuid-test.svg',
        originalFilename: 'test.svg',
        filePath: '/uploads/uuid-test.svg',
        status: 'processing',
      });

      expect(result).toMatchObject({
        filename: 'test.svg',
        status: 'processing',
        message: 'File uploaded successfully. Processing started.',
      });
    });
  });

  describe('getById', () => {
    it('should return design DTO with string ID', async () => {
      vi.mocked(designRepository.findById).mockResolvedValue(
        mockDesign as IDesign
      );

      const result = await designService.getById(mockDesignId);

      expect(result._id).toBe(mockDesignId);
      expect(result.filename).toBe('test-file.svg');
      expect(result.createdAt).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('list', () => {
    it('should return array of design list DTOs', async () => {
      vi.mocked(designRepository.findAll).mockResolvedValue([
        mockDesign as IDesign,
      ]);

      const result = await designService.list();

      expect(result).toHaveLength(1);
      expect(result[0]._id).toBe(mockDesignId);
      expect(result[0].filename).toBe('test-file.svg');
    });

    it('should return empty array when no designs', async () => {
      vi.mocked(designRepository.findAll).mockResolvedValue([]);

      const result = await designService.list();

      expect(result).toEqual([]);
    });
  });

  describe('delete', () => {
    it('should delete file from disk and record from database', async () => {
      vi.mocked(designRepository.findById).mockResolvedValue(
        mockDesign as IDesign
      );
      vi.mocked(fileService.deleteFile).mockResolvedValue();
      vi.mocked(designRepository.delete).mockResolvedValue();

      await designService.delete(mockDesignId);

      expect(fileService.deleteFile).toHaveBeenCalledWith(
        '/uploads/test-file.svg'
      );
      expect(designRepository.delete).toHaveBeenCalledWith(mockDesignId);
    });
  });
});
