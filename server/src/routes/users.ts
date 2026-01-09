import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  resetPassword,
} from '../controllers/users';

const router = express.Router();

router.get('/', authenticate, getUsers);
router.get('/:id', authenticate, getUser);
router.post('/', authenticate, createUser);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, deleteUser);
router.post('/:id/reset-password', authenticate, resetPassword);

export default router;
