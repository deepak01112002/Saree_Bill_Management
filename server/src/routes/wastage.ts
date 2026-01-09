import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createWastage,
  getWastage,
  getWastageList,
} from '../controllers/wastage';

const router = express.Router();

router.post('/', authenticate, createWastage);
router.get('/', authenticate, getWastageList);
router.get('/:id', authenticate, getWastage);

export default router;


