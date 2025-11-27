// routes/bestSellingRoutes.js
import express from "express";
import {
  getAllBestSelling,
  addToBestSelling,
  removeFromBestSelling,
  toggleBestSellingStatus,
  updateBestSellingOrder,
  clearAllBestSelling,
  syncBestSelling,
} from "../controllers/bestSellingController.js";

const router = express.Router();

// ========================================
// PUBLIC ROUTES (For customer-facing pages)
// ========================================

// GET /api/bestselling - Get all active best selling products
router.get("/", getAllBestSelling);

// ========================================
// ADMIN ROUTES (For admin panel)
// ========================================

// POST /api/bestselling - Add product to best selling
router.post("/", addToBestSelling);

// DELETE /api/bestselling/:productId - Remove product from best selling
router.delete("/:productId", removeFromBestSelling);

// PATCH /api/bestselling/:productId/toggle - Toggle active/inactive
router.patch("/:productId/toggle", toggleBestSellingStatus);

// PUT /api/bestselling/reorder - Update order of best selling items
router.put("/reorder", updateBestSellingOrder);

// DELETE /api/bestselling/clear/all - Clear all best selling (Admin utility)
router.delete("/clear/all", clearAllBestSelling);

// POST /api/bestselling/sync - Sync with products (cleanup)
router.post("/sync", syncBestSelling);

export default router;