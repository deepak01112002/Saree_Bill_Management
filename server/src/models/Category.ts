import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  code: string; // Short code for SKU generation (e.g., CAT01, DUP01)
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Category code is required'],
      trim: true,
      unique: true,
      uppercase: true,
      validate: {
        validator: function (v: string) {
          // Code should be 2-6 alphanumeric characters
          return /^[A-Z0-9]{2,6}$/.test(v);
        },
        message: 'Category code must be 2-6 alphanumeric characters (uppercase)',
      },
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
CategorySchema.index({ name: 1 });
CategorySchema.index({ code: 1 });

const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;


