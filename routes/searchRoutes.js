// routes/searchRoutes.js
import express from 'express';
import { smartSearch } from '../controllers/searchController.js';

const router = express.Router();

// Smart search endpoint
router.get('/', smartSearch);

export default router;