import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import Product from '../models/Product';
import Bill from '../models/Bill';

// Get dead stock report (products not sold in X days)
export const getDeadStock = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const days = req.query.days ? Number(req.query.days) : 90; // Default 90 days

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all products
    const products = await Product.find({ stockQuantity: { $gt: 0 } })
      .populate('category', 'name code')
      .sort({ createdAt: -1 });

    // Get all bills with product sales
    const bills = await Bill.find({
      createdAt: { $gte: cutoffDate },
    }).select('items createdAt');

    // Create a map of product IDs to their last sale date
    const productLastSale: { [key: string]: Date } = {};
    
    bills.forEach((bill) => {
      bill.items.forEach((item) => {
        const productId = item.productId.toString();
        const saleDate = new Date(bill.createdAt);
        
        // Update last sale date if this sale is more recent
        if (!productLastSale[productId] || saleDate > productLastSale[productId]) {
          productLastSale[productId] = saleDate;
        }
      });
    });

    // Find products that haven't been sold in the specified days
    const deadStock = products
      .map((product) => {
        const productId = product._id.toString();
        const lastSale = productLastSale[productId];
        const daysSinceLastSale = lastSale
          ? Math.floor((new Date().getTime() - lastSale.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        const neverSold = !lastSale;

        return {
          _id: product._id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          stockQuantity: product.stockQuantity,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          stockValue: product.costPrice * product.stockQuantity,
          lastSaleDate: lastSale || null,
          daysSinceLastSale: daysSinceLastSale,
          neverSold: neverSold,
        };
      })
      .filter((product) => {
        // Include if never sold OR last sale was before cutoff date
        return product.neverSold || (product.daysSinceLastSale !== null && product.daysSinceLastSale >= days);
      })
      .sort((a, b) => {
        // Sort by days since last sale (never sold first, then by days)
        if (a.neverSold && !b.neverSold) return -1;
        if (!a.neverSold && b.neverSold) return 1;
        return (b.daysSinceLastSale || 0) - (a.daysSinceLastSale || 0);
      });

    // Calculate total dead stock value
    const totalDeadStockValue = deadStock.reduce((sum, product) => sum + product.stockValue, 0);
    const totalDeadStockQuantity = deadStock.reduce((sum, product) => sum + product.stockQuantity, 0);

    res.json({
      days,
      cutoffDate: cutoffDate.toISOString(),
      deadStock,
      totalDeadStockValue,
      totalDeadStockQuantity,
      count: deadStock.length,
    });
  } catch (error: any) {
    console.error('Dead stock report error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate dead stock report' });
  }
};


