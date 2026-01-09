import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import Settings from '../models/Settings';

// Get settings (only one settings document exists)
export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    let settings = await Settings.findOne();
    
    // If no settings exist, create default
    if (!settings) {
      settings = await Settings.create({
        companyName: 'La Patola',
        website: 'www.lapatola.com',
        companyLogo: 'https://lapatola.com/cdn/shop/files/Screenshot_2025-12-25_183108.png?v=1766667767&width=535',
        registeredOfficeAddress: '',
        placeOfSupply: '',
        paymentTerms: 'Due on Receipt',
      });
    }
    
    res.json(settings);
  } catch (error: any) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: error.message || 'Failed to load settings' });
  }
};

// Update settings (only one settings document exists)
export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Only admin can update settings
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update settings' });
    }
    
    const updateData: any = {
      ...req.body,
      updatedBy: req.user!.id,
    };
    
    // Find existing settings or create new
    let settings = await Settings.findOne();
    
    if (settings) {
      // Update existing
      Object.assign(settings, updateData);
      await settings.save();
    } else {
      // Create new with provided data
      settings = await Settings.create(updateData);
    }
    
    res.json({
      message: 'Settings updated successfully',
      settings,
    });
  } catch (error: any) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: error.message || 'Failed to update settings' });
  }
};


