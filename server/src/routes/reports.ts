import express from 'express';
import { authenticate } from '../middleware/auth';
import { getDeadStock } from '../controllers/reports';

const router = express.Router();

router.get('/dead-stock', authenticate, getDeadStock);

export default router;


