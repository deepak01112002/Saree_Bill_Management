import express from 'express';
import { authenticate } from '../middleware/auth';
import { getSettings, updateSettings } from '../controllers/settings';

const router = express.Router();

router.get('/', authenticate, getSettings);
router.put('/', authenticate, updateSettings);

export default router;


