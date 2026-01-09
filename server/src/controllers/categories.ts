import { Request, Response } from 'express';
import Category from '../models/Category';
import connectDB from '../config/database';
import { AuthRequest } from '../middleware/auth';

// Get all categories
export const getCategories = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get category by ID
export const getCategory = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json(category);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create category (Staff can create)
export const createCategory = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { name, code, description } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({ error: 'Name and code are required' });
    }

    // Check if category with same name or code exists
    const existingCategory = await Category.findOne({
      $or: [{ name: name.trim() }, { code: code.trim().toUpperCase() }],
    });

    if (existingCategory) {
      return res.status(400).json({
        error: 'Category with this name or code already exists',
      });
    }

    const category = new Category({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      description: description?.trim() || '',
    });

    await category.save();
    res.status(201).json(category);
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error
      return res.status(400).json({
        error: 'Category with this name or code already exists',
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update category
export const updateCategory = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { name, code, description } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if updating name/code would create duplicate
    if (name || code) {
      const existingCategory = await Category.findOne({
        _id: { $ne: req.params.id },
        $or: [
          name ? { name: name.trim() } : {},
          code ? { code: code.trim().toUpperCase() } : {},
        ],
      });

      if (existingCategory) {
        return res.status(400).json({
          error: 'Category with this name or code already exists',
        });
      }
    }

    if (name) category.name = name.trim();
    if (code) category.code = code.trim().toUpperCase();
    if (description !== undefined) category.description = description?.trim() || '';

    await category.save();
    res.json(category);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Category with this name or code already exists',
      });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete category
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Check if category has products
    const Product = (await import('../models/Product')).default;
    const productCount = await Product.countDocuments({ category: req.params.id });
    
    if (productCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category. It has ${productCount} product(s) associated with it. Please remove or reassign products first.`,
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

