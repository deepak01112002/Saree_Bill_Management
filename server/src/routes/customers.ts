import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customers';

const router = express.Router();

router.get('/', authenticate, getCustomers);
router.get('/:id', authenticate, getCustomer);
router.post('/', authenticate, createCustomer);
router.put('/:id', authenticate, updateCustomer);
router.delete('/:id', authenticate, deleteCustomer);

export default router;


