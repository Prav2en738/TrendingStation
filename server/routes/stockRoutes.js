import express from 'express';
import { getMovements, getLowStock, adjustStock } from '../controllers/stockController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = express.Router();

// everything about stock is admin-only
router.use(authMiddleware, adminMiddleware);

router.get('/movements', getMovements);
router.get('/low', getLowStock);
router.post('/adjust', adjustStock);

export default router;
