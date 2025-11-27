import express from 'express';
import {
  getAllCollections,
  getEnabledCollections,
  getOfferCollections,
  getCollectionByName,
  createCollection,
  updateCollection,
  deleteCollection,
  toggleCollectionEnabled,
  toggleOfferEnabled,
  bulkUpdateCollections,
  seedDefaultCollections,
} from '../controllers/collectionController.js';

const router = express.Router();

// ========================
// PUBLIC ROUTES (No auth required for now)
// ========================

// Get all collections (for admin panel)
router.get('/', getAllCollections);

// Get enabled collections (for frontend display)
router.get('/enabled', getEnabledCollections);

// 🆕 Get offer collections (enabled + offerEnabled)
router.get('/offers', getOfferCollections);

// Get single collection by name
router.get('/:name', getCollectionByName);

// Create collection
router.post('/', createCollection);

// Update collection
router.put('/:id', updateCollection);

// Delete collection
router.delete('/:id', deleteCollection);

// Toggle enabled status
router.patch('/:id/toggle-enabled', toggleCollectionEnabled);

// Toggle offer status
router.patch('/:id/toggle-offer', toggleOfferEnabled);

// Bulk update collections
router.post('/bulk-update', bulkUpdateCollections);

// Seed default collections (run once)
router.post('/seed', seedDefaultCollections);

export default router;