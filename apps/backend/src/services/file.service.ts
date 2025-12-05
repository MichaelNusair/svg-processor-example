import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { config } from '../config';
import { FileUploadError } from '../errors';

class FileService {
  async ensureUploadDirectory(): Promise<void> {
    await fs.mkdir(config.upload.directory, { recursive: true });
  }

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch {
      // File might already be deleted
    }
  }

  createUploader(): multer.Multer {
    const storage = multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, config.upload.directory);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const base = path
          .basename(file.originalname, ext)
          .replace(/[^a-zA-Z0-9-_]/g, '_')
          .substring(0, 50);
        cb(null, `${uuidv4()}-${base}${ext}`);
      },
    });

    const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const allowedExts = config.upload.allowedExtensions as readonly string[];
      const allowedMimes = config.upload.allowedMimeTypes as readonly string[];
      if (allowedExts.includes(ext) || allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        const error = new FileUploadError(
          `Invalid file type. Allowed: ${config.upload.allowedExtensions.join(', ')}`
        );
        cb(error as unknown as null, false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: { fileSize: config.upload.maxFileSize, files: 1 },
    });
  }
}

export const fileService = new FileService();
