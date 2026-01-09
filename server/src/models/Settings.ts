import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  // Company Information
  companyName: string;
  companyLogo?: string; // URL or file path
  website: string;
  
  // Tax & Legal Information
  gstin?: string; // GST Identification Number
  pan?: string; // Permanent Account Number
  cin?: string; // Corporate Identification Number
  
  // Address Information
  registeredOfficeAddress: string;
  placeOfSupply: string;
  
  // Business Settings
  paymentTerms: string; // e.g., "Due on Receipt", "Net 30", etc.
  defaultDiscountPercentage?: number;
  
  // Contact Information
  phone?: string;
  email?: string;
  
  // Branding
  primaryColor?: string; // For UI customization
  secondaryColor?: string;
  
  // Additional Notes
  invoiceFooterNote?: string;
  termsAndConditions?: string;
  
  // Metadata
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      default: 'La Patola',
    },
    companyLogo: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      required: [true, 'Website is required'],
      trim: true,
      default: 'www.lapatola.com',
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GSTIN (15 characters)'],
    },
    pan: {
      type: String,
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN (10 characters)'],
    },
    cin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    registeredOfficeAddress: {
      type: String,
      required: [true, 'Registered office address is required'],
      trim: true,
    },
    placeOfSupply: {
      type: String,
      required: [true, 'Place of supply is required'],
      trim: true,
    },
    paymentTerms: {
      type: String,
      required: [true, 'Payment terms are required'],
      trim: true,
      default: 'Due on Receipt',
    },
    defaultDiscountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
    },
    primaryColor: {
      type: String,
      trim: true,
      default: '#3b82f6', // Blue
    },
    secondaryColor: {
      type: String,
      trim: true,
      default: '#ffffff', // White
    },
    invoiceFooterNote: {
      type: String,
      trim: true,
    },
    termsAndConditions: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one settings document exists
SettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings
    settings = await this.create({
      companyName: 'La Patola',
      website: 'www.lapatola.com',
      registeredOfficeAddress: '',
      placeOfSupply: '',
      paymentTerms: 'Due on Receipt',
    });
  }
  return settings;
};

const Settings = mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;


