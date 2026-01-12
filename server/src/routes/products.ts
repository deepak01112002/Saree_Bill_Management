import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getProducts,
  getProduct,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductsFromExcel,
  generateQRCode,
  generateBarcode,
} from '../controllers/products';

const router = express.Router();

router.get('/', authenticate, getProducts);
router.get('/sku/:sku', authenticate, getProductBySku); // Must be before /:id route
router.get('/:id', authenticate, getProduct);
router.post('/', authenticate, createProduct);
router.post('/upload', authenticate, uploadProductsFromExcel);
router.put('/:id', authenticate, updateProduct);
router.delete('/:id', authenticate, deleteProduct);
router.post('/:id/qr', authenticate, generateQRCode);
router.post('/:id/barcode', authenticate, generateBarcode);

export default router;

