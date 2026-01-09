import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import RollPolish from '../models/RollPolish';

// Create a new roll polish entry
export const createRollPolish = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const {
      rollNumber,
      fabricType,
      quantity,
      unit = 'meters',
      colorDesign,
      vendorName,
      vendorContact,
      vendorAddress,
      status = 'sent',
      sentDate,
      expectedReturnDate,
      actualReturnDate,
      notes,
    } = req.body;

    if (!rollNumber || !fabricType || quantity === undefined || !vendorName || !sentDate) {
      return res.status(400).json({
        error: 'Roll number, fabric type, quantity, vendor name, and sent date are required',
      });
    }

    // Check if roll number already exists
    const existingRoll = await RollPolish.findOne({ rollNumber: rollNumber.trim() });
    if (existingRoll) {
      return res.status(400).json({ error: 'Roll number already exists' });
    }

    const rollPolish = await RollPolish.create({
      rollNumber: rollNumber.trim(),
      fabricType: fabricType.trim(),
      quantity: parseFloat(quantity),
      unit: unit.trim(),
      colorDesign: colorDesign?.trim(),
      vendorName: vendorName.trim(),
      vendorContact: vendorContact?.trim(),
      vendorAddress: vendorAddress?.trim(),
      status,
      sentDate: new Date(sentDate),
      expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
      actualReturnDate: actualReturnDate ? new Date(actualReturnDate) : undefined,
      notes: notes?.trim(),
      createdBy: req.user?.id,
    });

    res.status(201).json(rollPolish);
  } catch (error: any) {
    console.error('Create roll polish error:', error);
    res.status(500).json({ error: error.message || 'Failed to create roll polish entry' });
  }
};

// Get all roll polish entries with filters
export const getRollPolishes = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { status, vendorName, startDate, endDate, search } = req.query;

    const query: any = {};

    if (status) {
      query.status = status;
    }

    if (vendorName) {
      query.vendorName = { $regex: vendorName, $options: 'i' };
    }

    if (startDate || endDate) {
      query.sentDate = {};
      if (startDate) {
        query.sentDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.sentDate.$lte = new Date(endDate as string);
      }
    }

    if (search) {
      query.$or = [
        { rollNumber: { $regex: search, $options: 'i' } },
        { fabricType: { $regex: search, $options: 'i' } },
        { vendorName: { $regex: search, $options: 'i' } },
      ];
    }

    const rollPolishes = await RollPolish.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(rollPolishes);
  } catch (error: any) {
    console.error('Get roll polishes error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch roll polish entries' });
  }
};

// Get a single roll polish entry by ID
export const getRollPolish = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;

    const rollPolish = await RollPolish.findById(id).populate('createdBy', 'name email');
    if (!rollPolish) {
      return res.status(404).json({ error: 'Roll polish entry not found' });
    }

    res.json(rollPolish);
  } catch (error: any) {
    console.error('Get roll polish error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch roll polish entry' });
  }
};

// Update a roll polish entry
export const updateRollPolish = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;
    const {
      rollNumber,
      fabricType,
      quantity,
      unit,
      colorDesign,
      vendorName,
      vendorContact,
      vendorAddress,
      status,
      sentDate,
      expectedReturnDate,
      actualReturnDate,
      notes,
    } = req.body;

    const rollPolish = await RollPolish.findById(id);
    if (!rollPolish) {
      return res.status(404).json({ error: 'Roll polish entry not found' });
    }

    // Check if roll number is being changed and if it already exists
    if (rollNumber && rollNumber.trim() !== rollPolish.rollNumber) {
      const existingRoll = await RollPolish.findOne({ rollNumber: rollNumber.trim() });
      if (existingRoll) {
        return res.status(400).json({ error: 'Roll number already exists' });
      }
    }

    if (rollNumber) rollPolish.rollNumber = rollNumber.trim();
    if (fabricType) rollPolish.fabricType = fabricType.trim();
    if (quantity !== undefined) rollPolish.quantity = parseFloat(quantity);
    if (unit) rollPolish.unit = unit.trim();
    if (colorDesign !== undefined) rollPolish.colorDesign = colorDesign?.trim();
    if (vendorName) rollPolish.vendorName = vendorName.trim();
    if (vendorContact !== undefined) rollPolish.vendorContact = vendorContact?.trim();
    if (vendorAddress !== undefined) rollPolish.vendorAddress = vendorAddress?.trim();
    if (status) rollPolish.status = status;
    if (sentDate) rollPolish.sentDate = new Date(sentDate);
    if (expectedReturnDate !== undefined) {
      rollPolish.expectedReturnDate = expectedReturnDate ? new Date(expectedReturnDate) : undefined;
    }
    if (actualReturnDate !== undefined) {
      rollPolish.actualReturnDate = actualReturnDate ? new Date(actualReturnDate) : undefined;
    }
    if (notes !== undefined) rollPolish.notes = notes?.trim();

    await rollPolish.save();
    res.json(rollPolish);
  } catch (error: any) {
    console.error('Update roll polish error:', error);
    res.status(500).json({ error: error.message || 'Failed to update roll polish entry' });
  }
};

// Delete a roll polish entry (Admin only)
export const deleteRollPolish = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;

    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete roll polish entries' });
    }

    const rollPolish = await RollPolish.findById(id);
    if (!rollPolish) {
      return res.status(404).json({ error: 'Roll polish entry not found' });
    }

    await RollPolish.findByIdAndDelete(id);
    res.json({ message: 'Roll polish entry deleted successfully' });
  } catch (error: any) {
    console.error('Delete roll polish error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete roll polish entry' });
  }
};
