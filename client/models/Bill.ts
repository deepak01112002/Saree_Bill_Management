import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBillItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IBill extends Document {
  billNumber: string;
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  items: IBillItem[];
  subtotal: number;
  gst: number;
  discount: number;
  grandTotal: number;
  paymentMode: 'cash' | 'upi' | 'card';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const BillItemSchema = new Schema<IBillItem>(
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
    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const BillSchema = new Schema<IBill>(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    customerId: {
      type: String,
      ref: 'Customer',
    },
    customerName: {
      type: String,
      trim: true,
    },
    customerMobile: {
      type: String,
      trim: true,
    },
    items: {
      type: [BillItemSchema],
      required: true,
      validate: {
        validator: (items: IBillItem[]) => items.length > 0,
        message: 'Bill must have at least one item',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    gst: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMode: {
      type: String,
      enum: ['cash', 'upi', 'card'],
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
BillSchema.index({ billNumber: 1 });
BillSchema.index({ createdAt: -1 });
BillSchema.index({ customerId: 1 });
BillSchema.index({ createdBy: 1 });

const Bill: Model<IBill> =
  mongoose.models.Bill || mongoose.model<IBill>('Bill', BillSchema);

export default Bill;


