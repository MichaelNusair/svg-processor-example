import mongoose from "mongoose";
import { Design, IDesign, DesignStatus } from "../models/Design";
import { NotFoundError } from "../errors";

export interface CreateDesignData {
  filename: string;
  originalFilename: string;
  filePath: string;
  status: DesignStatus;
}

export interface UpdateDesignData {
  status: DesignStatus;
  svgWidth?: number;
  svgHeight?: number;
  items?: IDesign["items"];
  itemsCount?: number;
  coverageRatio?: number;
  issues?: IDesign["issues"];
  errorMessage?: string;
}

class DesignRepository {
  async create(data: CreateDesignData): Promise<IDesign> {
    const design = new Design(data);
    return design.save();
  }

  async findById(id: string): Promise<IDesign> {
    try {
      const design = await Design.findById(id);
      if (!design) throw new NotFoundError("Design", id);
      return design;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (error instanceof mongoose.Error.CastError)
        throw new NotFoundError("Design", id);
      throw error;
    }
  }

  async update(id: string, data: UpdateDesignData): Promise<IDesign> {
    const design = await Design.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    );
    if (!design) throw new NotFoundError("Design", id);
    return design;
  }

  async findAll(): Promise<IDesign[]> {
    return Design.find()
      .select(
        "_id filename originalFilename status itemsCount coverageRatio issues createdAt"
      )
      .sort({ createdAt: -1 });
  }

  async delete(id: string): Promise<void> {
    const result = await Design.findByIdAndDelete(id);
    if (!result) throw new NotFoundError("Design", id);
  }
}

export const designRepository = new DesignRepository();
