import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import StockTransaction from '../models/StockTransaction';
import Product from '../models/Product';

export const getStockTransactions = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const transactions = await StockTransaction.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getStockHistory = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const transactions = await StockTransaction.find({
      productId: req.params.productId,
    }).sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateStock = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    // Stock update logic will be implemented
    res.json({ message: 'Stock update - to be implemented' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


