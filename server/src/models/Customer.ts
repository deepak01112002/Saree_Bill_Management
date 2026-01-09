import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  mobileNumber: string;
  email?: string; // Email ID
  address?: string;
  panCard?: string; // PAN Card Number
  gstNumber?: string; // GST Number
  firmName?: string; // Firm/Business Name
  totalPurchases?: number; // Total amount spent
  purchaseCount?: number; // Number of orders/purchases
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit mobile number'],
    },
    address: {
      type: String,
      trim: true,
    },
    panCard: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN card number (e.g., ABCDE1234F)'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number (15 characters)'],
    },
    firmName: {
      type: String,
      trim: true,
    },
    totalPurchases: {
      type: Number,
      default: 0,
      min: 0,
      // This stores the total amount spent by customer (sum of all bill grand totals)
    },
    purchaseCount: {
      type: Number,
      default: 0,
      min: 0,
      // This stores the number of orders/purchases made by customer
    },
    lastPurchaseDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster lookups
CustomerSchema.index({ mobileNumber: 1 });
CustomerSchema.index({ name: 'text' });

const Customer: Model<ICustomer> =
  mongoose.models.Customer ||
  mongoose.model<ICustomer>('Customer', CustomerSchema);

export default Customer;

