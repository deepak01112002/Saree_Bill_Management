import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import Lot from '../models/Lot';
import Product from '../models/Product';

// Generate LOT number based on date: LOT-YYYY-MM-DD
const generateLotNumber = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `LOT-${year}-${month}-${day}`;
};

// Get all LOTs
export const getLots = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { page = 1, limit = 20, category, status, startDate, endDate } = req.query;

    const query: any = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.uploadDate = {};
      if (startDate) {
        query.uploadDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999); // Include entire end date
        query.uploadDate.$lte = end;
      }
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const lots = await Lot.find(query)
      .populate('category', 'name code')
      .populate('uploadedBy', 'name email')
      .sort({ uploadDate: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Lot.countDocuments(query);

    res.json({
      lots,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get single LOT by ID
export const getLot = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const lot = await Lot.findById(req.params.id)
      .populate('category', 'name code')
      .populate('uploadedBy', 'name email')
      .populate('products', 'name sku costPrice sellingPrice stockQuantity');

    if (!lot) {
      return res.status(404).json({ error: 'LOT not found' });
    }

    res.json(lot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create LOT (usually called during Excel upload)
export const createLot = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { uploadDate, category, productIds } = req.body;

    const uploadDateObj = uploadDate ? new Date(uploadDate) : new Date();
    const lotNumber = generateLotNumber(uploadDateObj);

    // Check if LOT with same number already exists (for same day uploads, add timestamp)
    let finalLotNumber = lotNumber;
    let existingLot = await Lot.findOne({ lotNumber: finalLotNumber });
    let counter = 1;
    while (existingLot) {
      finalLotNumber = `${lotNumber}-${String(counter).padStart(3, '0')}`;
      existingLot = await Lot.findOne({ lotNumber: finalLotNumber });
      counter++;
    }

    // Calculate product count and total stock value
    let productCount = 0;
    let totalStockValue = 0;

    if (productIds && productIds.length > 0) {
      productCount = productIds.length;
      const products = await Product.find({ _id: { $in: productIds } });
      totalStockValue = products.reduce((sum, product) => {
        return sum + (product.costPrice * product.stockQuantity);
      }, 0);
    }

    const lot = await Lot.create({
      lotNumber: finalLotNumber,
      uploadDate: uploadDateObj,
      category: category || null,
      uploadedBy: req.user!.id,
      productCount,
      totalStockValue,
      status: 'active',
      products: productIds || [],
    });

    res.status(201).json(lot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Update LOT
export const updateLot = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { status, productIds } = req.body;

    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }

    // If products are updated, recalculate statistics
    if (productIds) {
      const products = await Product.find({ _id: { $in: productIds } });
      updateData.productCount = products.length;
      updateData.totalStockValue = products.reduce((sum, product) => {
        return sum + (product.costPrice * product.stockQuantity);
      }, 0);
      updateData.products = productIds;
    }

    const lot = await Lot.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name code')
      .populate('uploadedBy', 'name email');

    if (!lot) {
      return res.status(404).json({ error: 'LOT not found' });
    }

    res.json(lot);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Delete LOT (only if no products are linked)
export const deleteLot = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const lot = await Lot.findById(req.params.id);

    if (!lot) {
      return res.status(404).json({ error: 'LOT not found' });
    }

    // Check if any products are still linked to this LOT
    const productsCount = await Product.countDocuments({ lot: lot._id });
    if (productsCount > 0) {
      return res.status(400).json({
        error: `Cannot delete LOT. ${productsCount} product(s) are still linked to this LOT.`,
      });
    }

    await Lot.findByIdAndDelete(req.params.id);
    res.json({ message: 'LOT deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get products in a LOT
export const getLotProducts = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { page = 1, limit = 50 } = req.query;

    const lot = await Lot.findById(req.params.id);
    if (!lot) {
      return res.status(404).json({ error: 'LOT not found' });
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find({ lot: lot._id })
      .populate('category', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments({ lot: lot._id });

    res.json({
      products,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get all products in LOT for barcode download (no pagination)
export const getLotProductsForBarcodes = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const lot = await Lot.findById(req.params.id);
    if (!lot) {
      return res.status(404).json({ error: 'LOT not found' });
    }

    // Get ALL products in this LOT (no pagination for barcode download)
    const products = await Product.find({ lot: lot._id })
      .populate('category', 'name code')
      .sort({ createdAt: -1 })
      .select('name sku sellingPrice mrp category');

    res.json({
      products,
      lotNumber: lot.lotNumber,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

