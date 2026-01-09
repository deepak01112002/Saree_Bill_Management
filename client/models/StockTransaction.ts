import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStockTransaction extends Document {
  productId: string;
  type: 'in' | 'out' | 'return' | 'wastage';
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  createdBy: string;
  createdAt: Date;
}

const StockTransactionSchema = new Schema<IStockTransaction>(
  {
    productId: {
      type: String,
      required: true,
      ref: 'Product',
    },
    type: {
      type: String,
      enum: ['in', 'out', 'return', 'wastage'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    previousStock: {
      type: Number,
      required: true,
      min: 0,
    },
    newStock: {
      type: Number,
      required: true,
      min: 0,
    },
    referenceId: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
StockTransactionSchema.index({ productId: 1 });
StockTransactionSchema.index({ createdAt: -1 });
StockTransactionSchema.index({ type: 1 });

const StockTransaction: Model<IStockTransaction> =
  mongoose.models.StockTransaction ||
  mongoose.model<IStockTransaction>('StockTransaction', StockTransactionSchema);

export default StockTransaction;


