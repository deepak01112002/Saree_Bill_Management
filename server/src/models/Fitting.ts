import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFitting extends Document {
  serviceName: string; // e.g., "Saree Stitching", "Fall and Pico", "Blouse Stitching"
  description?: string;
  unit: string; // e.g., "item", "piece", "meter"
  rate: number; // Price per unit
  isActive: boolean; // Whether service is available
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const FittingSchema = new Schema<IFitting>(
  {
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      default: 'item',
    },
    rate: {
      type: Number,
      required: [true, 'Rate is required'],
      min: [0, 'Rate cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FittingSchema.index({ serviceName: 1 });
FittingSchema.index({ isActive: 1 });
FittingSchema.index({ createdAt: -1 });

const Fitting: Model<IFitting> =
  mongoose.models.Fitting || mongoose.model<IFitting>('Fitting', FittingSchema);

export default Fitting;


