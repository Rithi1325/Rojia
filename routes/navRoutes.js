// routes/navRoutes.js
import express from 'express';
import { 
  createnavItem, 
  getAllnavItem, 
  updatenavItem, 
  deletenavItem, 
  clearAllnavItems 
} from '../controllers/navController.js';

const router = express.Router();

// Create a new nav item
router.post('/', createnavItem);

// Get all nav items
router.get('/', getAllnavItem);

// Update a nav item
router.put('/:id', updatenavItem);

// Delete a nav item
router.delete('/:id', deletenavItem);

// Clear all nav items
router.delete('/', clearAllnavItems);

export default router;