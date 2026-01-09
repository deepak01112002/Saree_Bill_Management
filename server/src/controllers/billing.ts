import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import Bill from '../models/Bill';
import Product from '../models/Product';
import Customer from '../models/Customer';
import StockTransaction from '../models/StockTransaction';

export const createBill = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const {
      items,
      customerId,
      customerName,
      customerMobile,
      customerPanCard,
      customerEmail,
      customerGstNumber,
      customerFirmName,
      discount = 0,
      paymentMode = 'cash',
      additionalCharges = [], // Array of stitching services
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Bill must have at least one item' });
    }

    // Validate and process items
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).populate('category', 'name code');
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`,
        });
      }

      const itemSubtotal = item.price * item.quantity;
      
      // Get GST percentage from product (default to 0 if not set)
      const itemGstPercentage = product.gstPercentage || 0;
      
      // Calculate GST amount for this item
      const itemGstAmount = (itemSubtotal * itemGstPercentage) / 100;
      
      // Item total including GST
      const itemTotal = itemSubtotal + itemGstAmount;
      
      subtotal += itemSubtotal; // Subtotal without GST

      // Get category info
      const categoryName = (product.category as any)?.name || product.sareeType || 'Uncategorized';
      const categoryId = (product.category as any)?._id?.toString() || '';

      processedItems.push({
        productId: product._id.toString(),
        productName: product.name,
        productSku: product.sku,
        categoryId: categoryId,
        categoryName: categoryName,
        gstPercentage: itemGstPercentage,
        gstAmount: itemGstAmount,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal, // Total including GST
      });

      // Update product stock
      const previousStock = product.stockQuantity;
      product.stockQuantity -= item.quantity;
      
      // Lock price if not already locked (after first sale)
      if (!product.priceLocked) {
        product.priceLocked = true;
        product.priceLockedBy = req.user!.id as any; // Convert string to ObjectId
        product.priceLockedAt = new Date();
      }
      
      await product.save();

      // Create stock transaction
      await StockTransaction.create({
        productId: product._id.toString(),
        type: 'out',
        quantity: item.quantity,
        previousStock,
        newStock: product.stockQuantity,
        referenceId: '', // Will update after bill creation
        createdBy: req.user!.id,
      });
    }

    // Process additional charges (stitching services)
    const processedAdditionalCharges = (additionalCharges || []).map((charge: any) => ({
      serviceName: charge.serviceName || '',
      quantity: charge.quantity || 1,
      unit: charge.unit || 'item',
      rate: charge.rate || 0,
      amount: (charge.quantity || 1) * (charge.rate || 0),
    })).filter((charge: any) => charge.amount > 0 && charge.serviceName.trim() !== ''); // Only include valid charges

    const totalAdditionalCharges = processedAdditionalCharges.reduce(
      (sum: number, charge: any) => sum + charge.amount,
      0
    );

    // Calculate totals
    // GST is already calculated per item, sum all item GST amounts
    const totalGstAmount = processedItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
    
    // Calculate average GST percentage for display (optional)
    const avgGstPercentage = subtotal > 0 
      ? (totalGstAmount / subtotal) * 100 
      : 0;
    
    // Apply discount on subtotal (before GST and additional charges)
    const discountAmount = (subtotal * discount) / 100;
    
    // Grand total = Subtotal + Additional Charges + Total GST - Discount
    const grandTotal = subtotal + totalAdditionalCharges + totalGstAmount - discountAmount;

    // Auto-create customer if name and mobile provided but customerId not provided
    let finalCustomerId = customerId;
    if (!finalCustomerId && customerName && customerMobile) {
      // Check if customer already exists by mobile number
      let existingCustomer = await Customer.findOne({ mobileNumber: customerMobile });
      
      if (!existingCustomer) {
        // Create new customer
        existingCustomer = await Customer.create({
          name: customerName,
          mobileNumber: customerMobile,
          panCard: customerPanCard || undefined,
          email: customerEmail || undefined,
          gstNumber: customerGstNumber || undefined,
          firmName: customerFirmName || undefined,
          totalPurchases: 0,
          purchaseCount: 0,
        });
      } else {
        // Update existing customer with new information if provided
        let updated = false;
        if (customerPanCard && !existingCustomer.panCard) {
          existingCustomer.panCard = customerPanCard;
          updated = true;
        }
        if (customerEmail && !existingCustomer.email) {
          existingCustomer.email = customerEmail;
          updated = true;
        }
        if (customerGstNumber && !existingCustomer.gstNumber) {
          existingCustomer.gstNumber = customerGstNumber;
          updated = true;
        }
        if (customerFirmName && !existingCustomer.firmName) {
          existingCustomer.firmName = customerFirmName;
          updated = true;
        }
        if (updated) {
          await existingCustomer.save();
        }
      }
      finalCustomerId = existingCustomer._id.toString();
    }

    // Generate bill number (BILL-YYYYMMDD-001)
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
    const todayBills = await Bill.countDocuments({
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999)),
      },
    });
    const billNumber = `BILL-${dateStr}-${String(todayBills + 1).padStart(3, '0')}`;

    // Create bill
    const bill = await Bill.create({
      billNumber,
      customerId: finalCustomerId,
      customerName,
      customerMobile,
      customerPanCard: customerPanCard || undefined,
      items: processedItems,
      additionalCharges: processedAdditionalCharges.length > 0 ? processedAdditionalCharges : [],
      subtotal,
      gstPercentage: avgGstPercentage, // Average GST percentage for display
      gst: totalGstAmount, // Total GST amount from all items
      discountPercentage: discount, // Discount percentage
      discount: discountAmount,
      grandTotal,
      paymentMode,
      createdBy: req.user!.id,
    });

    // Update customer purchase stats if customer exists
    if (finalCustomerId) {
      // Recalculate from all bills to ensure accuracy (handles old data issues)
      const allCustomerBills = await Bill.find({ customerId: finalCustomerId });
      const totalSpent = allCustomerBills.reduce((sum, bill) => sum + (bill.grandTotal || 0), 0);
      const orderCount = allCustomerBills.length;

      await Customer.findByIdAndUpdate(finalCustomerId, {
        totalPurchases: totalSpent, // Total amount spent (recalculated)
        purchaseCount: orderCount, // Number of orders (recalculated)
        lastPurchaseDate: new Date(),
      });
    }

    // Update stock transactions with bill ID
    await StockTransaction.updateMany(
      { productId: { $in: processedItems.map((i) => i.productId) }, referenceId: '' },
      { $set: { referenceId: bill._id.toString() } }
    );

    res.status(201).json({
      message: 'Bill created successfully',
      bill,
    });
  } catch (error: any) {
    console.error('Bill creation error:', error);
    res.status(500).json({ error: error.message || 'Failed to create bill' });
  }
};

export const getBills = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { page = 1, limit = 20, startDate, endDate } = req.query;
    
    const query: any = {};
    
    // If staff, only show their bills
    if (req.user?.role === 'staff') {
      query.createdBy = req.user.id;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const bills = await Bill.find(query)
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Bill.countDocuments(query);

    res.json({
      bills,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBill = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    // If staff, only allow access to their own bills
    if (req.user?.role === 'staff' && bill.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own bills.' });
    }
    
    // Populate customer data if customerId exists
    let billData: any = bill.toObject();
    if (bill.customerId) {
      const customer = await Customer.findById(bill.customerId);
      if (customer) {
        billData.customerEmail = customer.email;
        billData.customerAddress = customer.address;
        billData.customerGstNumber = customer.gstNumber;
        billData.customerFirmName = customer.firmName;
      }
    }
    
    res.json(billData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBillByNumber = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const bill = await Bill.findOne({ billNumber: req.params.billNumber });
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    // If staff, only allow access to their own bills
    if (req.user?.role === 'staff' && bill.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your own bills.' });
    }
    
    res.json(bill);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

