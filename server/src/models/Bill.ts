import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBillItem {
  productId: string;
  productName: string;
  productSku?: string;
  categoryId?: string;
  categoryName?: string;
  gstPercentage?: number; // GST percentage for this item
  gstAmount?: number; // Calculated GST amount for this item
  quantity: number;
  price: number;
  total: number; // Total including GST
}

export interface IAdditionalCharge {
  serviceName: string; // e.g., "Saree Stitching", "Fall and Pico", "Blouse Stitching"
  quantity: number;
  unit: string; // e.g., "item", "piece"
  rate: number; // Price per unit
  amount: number; // Total amount (quantity * rate)
}

export interface IBill extends Document {
  billNumber: string;
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  customerPanCard?: string;
  items: IBillItem[];
  additionalCharges?: IAdditionalCharge[]; // Stitching services and other additional charges
  subtotal: number;
  gstPercentage: number;
  gst: number; // GST amount
  discountPercentage?: number; // Discount percentage
  discount: number; // Discount amount
  grandTotal: number;
  paymentMode: 'cash' | 'upi' | 'card';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdditionalChargeSchema = new Schema<IAdditionalCharge>(
  {
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
      default: 'item',
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

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
    productSku: {
      type: String,
      trim: true,
    },
    categoryId: {
      type: String,
      trim: true,
    },
    categoryName: {
      type: String,
      trim: true,
    },
    gstPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    gstAmount: {
      type: Number,
      min: 0,
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
    customerPanCard: {
      type: String,
      trim: true,
      uppercase: true,
    },
    items: {
      type: [BillItemSchema],
      required: true,
      validate: {
        validator: (items: IBillItem[]) => items.length > 0,
        message: 'Bill must have at least one item',
      },
    },
    additionalCharges: {
      type: [AdditionalChargeSchema],
      required: false,
      default: [],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    gstPercentage: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
      default: 0,
    },
    gst: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discountPercentage: {
      type: Number,
      required: false,
      min: 0,
      max: 100,
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

