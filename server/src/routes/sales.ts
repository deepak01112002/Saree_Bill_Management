import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSalesReport,
  getDailySales,
  getMonthlySales,
  getProductWiseSales,
  getStaffWiseSales,
  getYearlySales,
  getHighestSalesReports,
} from '../controllers/sales';

const router = express.Router();

router.get('/report', authenticate, getSalesReport);
router.get('/daily', authenticate, getDailySales);
router.get('/monthly', authenticate, getMonthlySales);
router.get('/yearly', authenticate, getYearlySales);
router.get('/highest', authenticate, getHighestSalesReports);
router.get('/product-wise', authenticate, getProductWiseSales);
router.get('/staff-wise', authenticate, getStaffWiseSales);

export default router;

