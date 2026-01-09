import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import Fitting from '../models/Fitting';

// Create a new fitting service
export const createFitting = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { serviceName, description, unit, rate, isActive = true } = req.body;

    if (!serviceName || !unit || rate === undefined) {
      return res.status(400).json({ error: 'Service name, unit, and rate are required' });
    }

    // Check if service name already exists
    const existingFitting = await Fitting.findOne({ serviceName: serviceName.trim() });
    if (existingFitting) {
      return res.status(400).json({ error: 'Fitting service with this name already exists' });
    }

    const fitting = await Fitting.create({
      serviceName: serviceName.trim(),
      description: description?.trim(),
      unit: unit.trim(),
      rate: parseFloat(rate),
      isActive: isActive !== false,
      createdBy: req.user?.id,
    });

    res.status(201).json(fitting);
  } catch (error: any) {
    console.error('Create fitting error:', error);
    res.status(500).json({ error: error.message || 'Failed to create fitting service' });
  }
};

// Get all fitting services
export const getFittings = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { activeOnly } = req.query;

    const query: any = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }

    const fittings = await Fitting.find(query).sort({ createdAt: -1 });
    res.json(fittings);
  } catch (error: any) {
    console.error('Get fittings error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch fitting services' });
  }
};

// Get a single fitting service by ID
export const getFitting = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;

    const fitting = await Fitting.findById(id);
    if (!fitting) {
      return res.status(404).json({ error: 'Fitting service not found' });
    }

    res.json(fitting);
  } catch (error: any) {
    console.error('Get fitting error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch fitting service' });
  }
};

// Update a fitting service
export const updateFitting = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { serviceName, description, unit, rate, isActive } = req.body;

    const fitting = await Fitting.findById(id);
    if (!fitting) {
      return res.status(404).json({ error: 'Fitting service not found' });
    }

    // Check if service name is being changed and if it already exists
    if (serviceName && serviceName.trim() !== fitting.serviceName) {
      const existingFitting = await Fitting.findOne({ serviceName: serviceName.trim() });
      if (existingFitting) {
        return res.status(400).json({ error: 'Fitting service with this name already exists' });
      }
    }

    if (serviceName) fitting.serviceName = serviceName.trim();
    if (description !== undefined) fitting.description = description?.trim();
    if (unit) fitting.unit = unit.trim();
    if (rate !== undefined) fitting.rate = parseFloat(rate);
    if (isActive !== undefined) fitting.isActive = isActive;

    await fitting.save();
    res.json(fitting);
  } catch (error: any) {
    console.error('Update fitting error:', error);
    res.status(500).json({ error: error.message || 'Failed to update fitting service' });
  }
};

// Delete a fitting service
export const deleteFitting = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    const { id } = req.params;

    const fitting = await Fitting.findById(id);
    if (!fitting) {
      return res.status(404).json({ error: 'Fitting service not found' });
    }

    await Fitting.findByIdAndDelete(id);
    res.json({ message: 'Fitting service deleted successfully' });
  } catch (error: any) {
    console.error('Delete fitting error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete fitting service' });
  }
};

