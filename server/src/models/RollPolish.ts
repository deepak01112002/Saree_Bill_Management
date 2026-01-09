import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IRollPolish extends Document {
  rollNumber: string;
  fabricType: string;
  quantity: number;
  unit: string; // e.g., "meters", "pieces"
  colorDesign?: string;
  vendorName: string;
  vendorContact?: string;
  vendorAddress?: string;
  status: 'sent' | 'in_process' | 'completed' | 'returned' | 'cancelled';
  sentDate: Date;
  expectedReturnDate?: Date;
  actualReturnDate?: Date;
  notes?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RollPolishSchema = new Schema<IRollPolish>(
  {
    rollNumber: {
      type: String,
      required: [true, 'Roll number is required'],
      trim: true,
      unique: true,
    },
    fabricType: {
      type: String,
      required: [true, 'Fabric type is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      trim: true,
      default: 'meters',
      enum: ['meters', 'pieces'],
    },
    colorDesign: {
      type: String,
      trim: true,
    },
    vendorName: {
      type: String,
      required: [true, 'Vendor name is required'],
      trim: true,
    },
    vendorContact: {
      type: String,
      trim: true,
    },
    vendorAddress: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['sent', 'in_process', 'completed', 'returned', 'cancelled'],
      default: 'sent',
    },
    sentDate: {
      type: Date,
      required: [true, 'Sent date is required'],
    },
    expectedReturnDate: {
      type: Date,
    },
    actualReturnDate: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
RollPolishSchema.index({ rollNumber: 1 });
RollPolishSchema.index({ status: 1 });
RollPolishSchema.index({ vendorName: 1 });
RollPolishSchema.index({ sentDate: -1 });
RollPolishSchema.index({ createdBy: 1 });

const RollPolish: Model<IRollPolish> =
  mongoose.models.RollPolish || mongoose.model<IRollPolish>('RollPolish', RollPolishSchema);

export default RollPolish;
