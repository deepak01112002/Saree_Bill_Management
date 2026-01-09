import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createFitting,
  getFittings,
  getFitting,
  updateFitting,
  deleteFitting,
} from '../controllers/fittings';

const router = express.Router();

router.post('/', authenticate, createFitting);
router.get('/', authenticate, getFittings);
router.get('/:id', authenticate, getFitting);
router.put('/:id', authenticate, updateFitting);
router.delete('/:id', authenticate, deleteFitting);

export default router;


