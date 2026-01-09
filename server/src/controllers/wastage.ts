import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import Wastage from '../models/Wastage';
import Product from '../models/Product';
import StockTransaction from '../models/StockTransaction';

export const createWastage = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { productId, quantity, reason } = req.body;

    if (!productId || !quantity || !reason) {
      return res.status(400).json({
        error: 'Product ID, quantity, and reason are required',
      });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.stockQuantity < quantity) {
      return res.status(400).json({
        error: `Insufficient stock. Available: ${product.stockQuantity}, Requested: ${quantity}`,
      });
    }

    // Calculate cost impact
    const costImpact = product.costPrice * quantity;

    // Update product stock (deduct)
    const previousStock = product.stockQuantity;
    product.stockQuantity -= quantity;
    await product.save();

    // Create stock transaction
    await StockTransaction.create({
      productId: product._id.toString(),
      type: 'wastage',
      quantity,
      previousStock,
      newStock: product.stockQuantity,
      createdBy: req.user!.id,
    });

    // Create wastage record
    const wastage = await Wastage.create({
      productId: product._id.toString(),
      productName: product.name,
      quantity,
      reason,
      costImpact,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      message: 'Wastage recorded successfully',
      wastage,
    });
  } catch (error: any) {
    console.error('Wastage creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to record wastage' });
  }
};

export const getWastageList = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const wastage = await Wastage.find().sort({ createdAt: -1 });
    res.json(wastage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getWastage = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const wastage = await Wastage.findById(req.params.id);
    if (!wastage) {
      return res.status(404).json({ error: 'Wastage not found' });
    }
    res.json(wastage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

