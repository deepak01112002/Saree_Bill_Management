import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import Return from '../models/Return';
import Bill from '../models/Bill';
import Product from '../models/Product';
import StockTransaction from '../models/StockTransaction';

export const createReturn = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { billId, billNumber, items, refundMode = 'cash' } = req.body;

    if (!billId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Bill ID and items are required' });
    }

    // Verify bill exists
    const bill = await Bill.findById(billId);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Process return items
    let refundAmount = 0;
    const processedItems = [];

    for (const returnItem of items) {
      // Find item in original bill
      const billItem = bill.items.find(
        (item: any) => item.productId === returnItem.productId
      );

      if (!billItem) {
        return res.status(400).json({
          error: `Product ${returnItem.productId} not found in bill`,
        });
      }

      if (returnItem.quantity > billItem.quantity) {
        return res.status(400).json({
          error: `Return quantity cannot exceed original quantity for ${billItem.productName}`,
        });
      }

      const itemRefund = returnItem.price * returnItem.quantity;
      refundAmount += itemRefund;

      processedItems.push({
        productId: returnItem.productId,
        productName: returnItem.productName || billItem.productName,
        quantity: returnItem.quantity,
        price: returnItem.price,
        reason: returnItem.reason || 'Not specified',
      });

      // Update product stock (add back)
      const product = await Product.findById(returnItem.productId);
      if (product) {
        const previousStock = product.stockQuantity;
        product.stockQuantity += returnItem.quantity;
        await product.save();

        // Create stock transaction
        await StockTransaction.create({
          productId: product._id.toString(),
          type: 'return',
          quantity: returnItem.quantity,
          previousStock,
          newStock: product.stockQuantity,
          referenceId: billId,
          createdBy: req.user!.id,
        });
      }
    }

    // Create return record
    const returnRecord = await Return.create({
      billId,
      billNumber: billNumber || bill.billNumber,
      items: processedItems,
      refundAmount,
      refundMode,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      message: 'Return processed successfully',
      return: returnRecord,
    });
  } catch (error: any) {
    console.error('Return creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to process return' });
  }
};

export const getReturns = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const returns = await Return.find().sort({ createdAt: -1 });
    res.json(returns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getReturn = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const returnRecord = await Return.findById(req.params.id);
    if (!returnRecord) {
      return res.status(404).json({ error: 'Return not found' });
    }
    res.json(returnRecord);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

