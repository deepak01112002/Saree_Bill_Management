import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  sareeType: string;
  brand: string;
  color: string;
  pattern: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number; // Maximum Retail Price
  gstPercentage?: number; // GST Percentage per product (e.g., 12, 18, 28)
  hsnCode?: string; // HSN (Harmonized System of Nomenclature) Code
  sku: string;
  productCode?: string; // Product Code from Excel (e.g., LP-PT-001)
  stockQuantity: number;
  stockUnit?: string; // Stock unit (e.g., PCS, KG, etc.)
  purchaseDate: Date;
  category?: mongoose.Types.ObjectId;
  lot?: mongoose.Types.ObjectId; // Reference to Lot
  lotNumber?: string; // LOT number for quick reference (e.g., LOT-2026-01-05)
  priceLocked: boolean; // Whether price is locked (cannot be edited without admin approval)
  priceLockedBy?: mongoose.Types.ObjectId; // User who locked the price (via billing)
  priceLockedAt?: Date; // When price was locked
  qrCode?: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    sareeType: {
      type: String,
      required: [true, 'Saree type is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
    },
    pattern: {
      type: String,
      trim: true,
      default: '',
    },
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    mrp: {
      type: Number,
      min: [0, 'MRP cannot be negative'],
    },
    gstPercentage: {
      type: Number,
      min: [0, 'GST percentage cannot be negative'],
      max: [100, 'GST percentage cannot exceed 100%'],
    },
    hsnCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    productCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock quantity cannot be negative'],
      default: 0,
    },
    stockUnit: {
      type: String,
      trim: true,
      default: 'PCS',
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
      default: Date.now,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: false, // Make optional for backward compatibility
    },
    lot: {
      type: Schema.Types.ObjectId,
      ref: 'Lot',
    },
    lotNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    priceLocked: {
      type: Boolean,
      default: false,
    },
    priceLockedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    priceLockedAt: {
      type: Date,
    },
    qrCode: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
ProductSchema.index({ sku: 1 });
ProductSchema.index({ name: 'text', brand: 'text', sareeType: 'text' });
ProductSchema.index({ stockQuantity: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ lot: 1 });
ProductSchema.index({ lotNumber: 1 });

const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);

export default Product;

