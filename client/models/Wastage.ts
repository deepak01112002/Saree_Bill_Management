import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWastage extends Document {
  productId: string;
  productName: string;
  quantity: number;
  reason: string;
  costImpact: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const WastageSchema = new Schema<IWastage>(
  {
    productId: {
      type: String,
      required: true,
      ref: 'Product',
    },
    productName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: [true, 'Reason is required'],
      enum: [
        'damage',
        'stain',
        'cutting',
        'defect',
        'expired',
        'other',
      ],
    },
    costImpact: {
      type: Number,
      required: true,
      min: 0,
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
WastageSchema.index({ productId: 1 });
WastageSchema.index({ createdAt: -1 });
WastageSchema.index({ createdBy: 1 });

const Wastage: Model<IWastage> =
  mongoose.models.Wastage || mongoose.model<IWastage>('Wastage', WastageSchema);

export default Wastage;


