import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getStockTransactions,
  getStockHistory,
  updateStock,
} from '../controllers/stock';

const router = express.Router();

router.get('/transactions', authenticate, getStockTransactions);
router.get('/history/:productId', authenticate, getStockHistory);
router.post('/update', authenticate, updateStock);

export default router;


