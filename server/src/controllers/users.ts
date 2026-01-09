import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import connectDB from '../config/database';
import User from '../models/User';
import bcrypt from 'bcryptjs';

// Get all users (admin only)
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can view users' });
    }

    const { page = 1, limit = 20, role, search } = req.query;

    const query: any = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(query)
      .select('-password') // Exclude password from response
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);

    res.json({
      users,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Get single user by ID
export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Users can view their own profile, admins can view any
    if (req.user?.role !== 'admin' && req.user?.id !== req.params.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Create new user (admin only)
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create users' });
    }

    const { name, email, password, role = 'staff', profilePhoto, isActive = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'staff',
      profilePhoto,
      isActive,
    });

    // Return user without password
    const userResponse: any = user.toObject();
    delete userResponse.password;

    res.status(201).json(userResponse);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Update user (admin can update any, users can update their own profile)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    const userId = req.params.id;
    const isAdmin = req.user?.role === 'admin';
    const isOwnProfile = req.user?.id === userId;

    // Check permissions
    if (!isAdmin && !isOwnProfile) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email, password, role, profilePhoto, isActive } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
    
    // Only admin can change role and isActive
    if (isAdmin) {
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
    }

    // Handle password update
    if (password) {
      if (!isAdmin && !isOwnProfile) {
        return res.status(403).json({ error: 'Cannot change password for other users' });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

// Delete user (admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    const userId = req.params.id;

    // Prevent deleting own account
    if (req.user?.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Reset user password (admin only)
export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();
    
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can reset passwords' });
    }

    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { password: hashedPassword },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Password reset successfully', user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
