import mongoose, { Document, Schema } from "mongoose";
import type { RectangleItem, DesignIssue, DesignStatus } from "@svg-processor/shared-types";

export type { RectangleItem, DesignIssue, DesignStatus };

export interface IDesign extends Document {
  _id: mongoose.Types.ObjectId;
  filename: string;
  originalFilename: string;
  filePath: string;
  status: DesignStatus;
  svgWidth?: number;
  svgHeight?: number;
  items: RectangleItem[];
  itemsCount: number;
  coverageRatio: number;
  issues: DesignIssue[];
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RectangleSchema = new Schema<RectangleItem>(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    fill: { type: String, required: true, default: "#000000" },
    isOutOfBounds: { type: Boolean, default: false },
  },
  { _id: false }
);

const DesignSchema = new Schema<IDesign>(
  {
    filename: { type: String, required: true, index: true },
    originalFilename: { type: String, required: true },
    filePath: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "error"],
      default: "pending",
      index: true,
    },
    svgWidth: { type: Number },
    svgHeight: { type: Number },
    items: { type: [RectangleSchema], default: [] },
    itemsCount: { type: Number, default: 0 },
    coverageRatio: { type: Number, default: 0 },
    issues: { type: [String], enum: ["EMPTY", "OUT_OF_BOUNDS"], default: [] },
    errorMessage: { type: String },
  },
  { timestamps: true }
);

DesignSchema.index({ createdAt: -1 });

export const Design = mongoose.model<IDesign>("Design", DesignSchema);
