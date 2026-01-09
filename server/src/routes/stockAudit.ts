import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getAudits,
  getAudit,
  createAudit,
  addAuditItem,
  completeAudit,
  cancelAudit,
  removeAuditItem,
} from '../controllers/stockAudit';

const router = express.Router();

router.get('/', authenticate, getAudits);
router.get('/:id', authenticate, getAudit);
router.post('/', authenticate, createAudit);
router.post('/:auditId/items', authenticate, addAuditItem);
router.post('/:auditId/complete', authenticate, completeAudit);
router.post('/:id/cancel', authenticate, cancelAudit);
router.delete('/:auditId/items/:productId', authenticate, removeAuditItem);

export default router;


