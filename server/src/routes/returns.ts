import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createReturn,
  getReturns,
  getReturn,
} from '../controllers/returns';

const router = express.Router();

router.post('/', authenticate, createReturn);
router.get('/', authenticate, getReturns);
router.get('/:id', authenticate, getReturn);

export default router;


