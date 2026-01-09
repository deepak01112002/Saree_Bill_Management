import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getLots,
  getLot,
  createLot,
  updateLot,
  deleteLot,
  getLotProducts,
  getLotProductsForBarcodes,
} from '../controllers/lots';

const router = express.Router();

router.get('/', authenticate, getLots);
router.get('/:id', authenticate, getLot);
router.post('/', authenticate, createLot);
router.put('/:id', authenticate, updateLot);
router.delete('/:id', authenticate, deleteLot);
router.get('/:id/products', authenticate, getLotProducts);
router.get('/:id/products/barcodes', authenticate, getLotProductsForBarcodes);

export default router;

