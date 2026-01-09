import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  reason: string;
}

export interface IReturn extends Document {
  billId: string;
  billNumber: string;
  items: IReturnItem[];
  refundAmount: number;
  refundMode: 'cash' | 'upi' | 'card' | 'adjustment';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReturnItemSchema = new Schema<IReturnItem>(
  {
    productId: {
      type: String,
      required: true,
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
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const ReturnSchema = new Schema<IReturn>(
  {
    billId: {
      type: String,
      required: true,
      ref: 'Bill',
    },
    billNumber: {
      type: String,
      required: true,
    },
    items: {
      type: [ReturnItemSchema],
      required: true,
      validate: {
        validator: (items: IReturnItem[]) => items.length > 0,
        message: 'Return must have at least one item',
      },
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    refundMode: {
      type: String,
      enum: ['cash', 'upi', 'card', 'adjustment'],
      required: true,
      default: 'cash',
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
ReturnSchema.index({ billId: 1 });
ReturnSchema.index({ billNumber: 1 });
ReturnSchema.index({ createdAt: -1 });

const Return: Model<IReturn> =
  mongoose.models.Return || mongoose.model<IReturn>('Return', ReturnSchema);

export default Return;


