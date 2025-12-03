import type { Request, Response } from "express";
import { designService } from "../services/design.service";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateFileUpload, validateObjectId } from "../validators/design.validator";
import { HttpStatus } from "../errors";

export const designController = {
  upload: asyncHandler(async (req: Request, res: Response) => {
    validateFileUpload(req);
    const result = await designService.create(req.file!);
    res.status(HttpStatus.CREATED).json(result);
  }),

  list: asyncHandler(async (_req: Request, res: Response) => {
    const designs = await designService.list();
    res.json(designs);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    validateObjectId(req.params.id);
    const design = await designService.getById(req.params.id);
    res.json(design);
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    validateObjectId(req.params.id);
    await designService.delete(req.params.id);
    res.status(HttpStatus.NO_CONTENT).send();
  }),
};
