import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createBill,
  getBills,
  getBill,
  getBillByNumber,
} from '../controllers/billing';

const router = express.Router();

router.post('/', authenticate, createBill);
router.get('/', authenticate, getBills);
router.get('/:id', authenticate, getBill);
router.get('/number/:billNumber', authenticate, getBillByNumber);

export default router;


