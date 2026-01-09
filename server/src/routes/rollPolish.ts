import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  createRollPolish,
  getRollPolishes,
  getRollPolish,
  updateRollPolish,
  deleteRollPolish,
} from '../controllers/rollPolish';

const router = express.Router();

router.post('/', authenticate, createRollPolish);
router.get('/', authenticate, getRollPolishes);
router.get('/:id', authenticate, getRollPolish);
router.put('/:id', authenticate, updateRollPolish);
router.delete('/:id', authenticate, deleteRollPolish);

export default router;
