import express from 'express';
import {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categories';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All category routes require authentication
// Staff can create categories, Admin can do everything
router.get('/', authenticate, getCategories);
router.get('/:id', authenticate, getCategory);
router.post('/', authenticate, createCategory);
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, deleteCategory);

export default router;


