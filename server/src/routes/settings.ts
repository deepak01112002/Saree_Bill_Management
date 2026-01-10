import express from 'express';
import { authenticate } from '../middleware/auth';
import { getSettings, updateSettings } from '../controllers/settings';

const router = express.Router();

// GET settings is public so login page can display company name
router.get('/', getSettings);
router.put('/', authenticate, updateSettings);

export default router;


