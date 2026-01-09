import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILot extends Document {
  lotNumber: string; // LOT-YYYY-MM-DD (e.g., LOT-2026-01-05)
  uploadDate: Date; // Date when Excel was uploaded
  category?: mongoose.Types.ObjectId; // Category for this LOT
  uploadedBy: mongoose.Types.ObjectId; // User who uploaded
  productCount: number; // Number of products in this LOT
  totalStockValue: number; // Total value of stock in this LOT (cost price * stock quantity)
  status: 'active' | 'closed'; // LOT status
  products: mongoose.Types.ObjectId[]; // Array of product IDs
  createdAt: Date;
  updatedAt: Date;
}

const LotSchema = new Schema<ILot>(
  {
    lotNumber: {
      type: String,
      required: [true, 'LOT number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    uploadDate: {
      type: Date,
      required: [true, 'Upload date is required'],
      default: Date.now,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploaded by is required'],
    },
    productCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalStockValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
LotSchema.index({ lotNumber: 1 });
LotSchema.index({ uploadDate: -1 });
LotSchema.index({ category: 1 });
LotSchema.index({ status: 1 });
LotSchema.index({ uploadedBy: 1 });

const Lot: Model<ILot> = mongoose.models.Lot || mongoose.model<ILot>('Lot', LotSchema);

export default Lot;


