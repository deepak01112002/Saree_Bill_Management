import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import StockAudit from '../models/StockAudit';
import Product from '../models/Product';
import StockTransaction from '../models/StockTransaction';

// Generate audit number: AUDIT-YYYY-MM-DD-001
const generateAuditNumber = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `AUDIT-${year}-${month}-${day}`;
};

// Get all audits
export const getAudits = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.auditDate = {};
      if (startDate) {
        query.auditDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.auditDate.$lte = end;
      }
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const audits = await StockAudit.find(query)
      .populate('conductedBy', 'name email')
      .sort({ auditDate: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await StockAudit.countDocuments(query);

    res.json({
      audits,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get single audit by ID
export const getAudit = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const audit = await StockAudit.findById(req.params.id)
      .populate('conductedBy', 'name email')
      .populate('items.productId', 'name sku sellingPrice costPrice');

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    res.json(audit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create new audit session
export const createAudit = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { notes } = req.body;

    const auditDate = new Date();
    const auditNumber = generateAuditNumber(auditDate);

    // Check if audit with same number exists
    let finalAuditNumber = auditNumber;
    let existingAudit = await StockAudit.findOne({ auditNumber: finalAuditNumber });
    let counter = 1;
    while (existingAudit) {
      finalAuditNumber = `${auditNumber}-${String(counter).padStart(3, '0')}`;
      existingAudit = await StockAudit.findOne({ auditNumber: finalAuditNumber });
      counter++;
    }

    const audit = await StockAudit.create({
      auditNumber: finalAuditNumber,
      auditDate,
      conductedBy: req.user!.id,
      status: 'in_progress',
      items: [],
      totalProducts: 0,
      discrepancies: 0,
      notes: notes || '',
    });

    res.status(201).json(audit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Add/update item in audit (by scanning barcode)
export const addAuditItem = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { auditId, sku, physicalStock, notes } = req.body;

    if (!sku || physicalStock === undefined) {
      return res.status(400).json({ error: 'SKU and physical stock are required' });
    }

    // Find product by SKU
    const product = await Product.findOne({ sku: sku.toUpperCase() });
    if (!product) {
      return res.status(404).json({ error: `Product with SKU "${sku}" not found` });
    }

    // Find audit
    const audit = await StockAudit.findById(auditId);
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (audit.status !== 'in_progress') {
      return res.status(400).json({ error: 'Cannot add items to completed or cancelled audit' });
    }

    // Check if item already exists in audit
    const existingItemIndex = audit.items.findIndex(
      (item) => item.productId.toString() === product._id.toString()
    );

    const difference = physicalStock - product.stockQuantity;
    const auditItem = {
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      systemStock: product.stockQuantity,
      physicalStock,
      difference,
      notes: notes || '',
    };

    if (existingItemIndex >= 0) {
      // Update existing item
      audit.items[existingItemIndex] = auditItem;
    } else {
      // Add new item
      audit.items.push(auditItem);
    }

    // Recalculate totals
    audit.totalProducts = audit.items.length;
    audit.discrepancies = audit.items.filter((item) => item.difference !== 0).length;

    await audit.save();

    res.json({
      message: 'Item added to audit',
      item: auditItem,
      audit: {
        totalProducts: audit.totalProducts,
        discrepancies: audit.discrepancies,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Complete audit and optionally apply adjustments
export const completeAudit = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { auditId, applyAdjustments = false } = req.body;

    const audit = await StockAudit.findById(auditId);
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (audit.status !== 'in_progress') {
      return res.status(400).json({ error: 'Audit is already completed or cancelled' });
    }

    // Update audit status
    audit.status = 'completed';
    await audit.save();

    // Apply stock adjustments if requested
    if (applyAdjustments) {
      for (const item of audit.items) {
        if (item.difference !== 0) {
          const product = await Product.findById(item.productId);
          if (product) {
            const previousStock = product.stockQuantity;
            product.stockQuantity = item.physicalStock;
            await product.save();

            // Create stock transaction
            await StockTransaction.create({
              productId: product._id.toString(),
              type: item.difference > 0 ? 'in' : 'out',
              quantity: Math.abs(item.difference),
              previousStock,
              newStock: item.physicalStock,
              referenceId: audit.auditNumber,
              createdBy: req.user!.id,
            });
          }
        }
      }
    }

    res.json({
      message: 'Audit completed successfully',
      audit,
      adjustmentsApplied: applyAdjustments,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Cancel audit
export const cancelAudit = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const audit = await StockAudit.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    res.json({ message: 'Audit cancelled successfully', audit });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Remove item from audit
export const removeAuditItem = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { auditId, productId } = req.params;

    const audit = await StockAudit.findById(auditId);
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (audit.status !== 'in_progress') {
      return res.status(400).json({ error: 'Cannot remove items from completed or cancelled audit' });
    }

    audit.items = audit.items.filter(
      (item) => item.productId.toString() !== productId
    );

    // Recalculate totals
    audit.totalProducts = audit.items.length;
    audit.discrepancies = audit.items.filter((item) => item.difference !== 0).length;

    await audit.save();

    res.json({ message: 'Item removed from audit', audit });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};


