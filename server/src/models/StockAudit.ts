import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStockAuditItem {
  productId: mongoose.Types.ObjectId;
  productName: string;
  sku: string;
  systemStock: number; // Stock in system
  physicalStock: number; // Stock counted physically
  difference: number; // physicalStock - systemStock
  notes?: string;
}

export interface IStockAudit extends Document {
  auditNumber: string; // AUDIT-YYYY-MM-DD-001
  auditDate: Date;
  conductedBy: mongoose.Types.ObjectId; // User who conducted audit
  status: 'in_progress' | 'completed' | 'cancelled';
  items: IStockAuditItem[];
  totalProducts: number;
  discrepancies: number; // Number of products with differences
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StockAuditItemSchema = new Schema<IStockAuditItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      required: true,
    },
    systemStock: {
      type: Number,
      required: true,
      min: 0,
    },
    physicalStock: {
      type: Number,
      required: true,
      min: 0,
    },
    difference: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const StockAuditSchema = new Schema<IStockAudit>(
  {
    auditNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    auditDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    conductedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'cancelled'],
      default: 'in_progress',
    },
    items: [StockAuditItemSchema],
    totalProducts: {
      type: Number,
      default: 0,
      min: 0,
    },
    discrepancies: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StockAuditSchema.index({ auditNumber: 1 });
StockAuditSchema.index({ auditDate: -1 });
StockAuditSchema.index({ status: 1 });
StockAuditSchema.index({ conductedBy: 1 });

const StockAudit: Model<IStockAudit> =
  mongoose.models.StockAudit || mongoose.model<IStockAudit>('StockAudit', StockAuditSchema);

export default StockAudit;


