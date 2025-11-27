// routes/productRoutes.js
import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  permanentlyDeleteProduct,
  getProductsByCollection,
  searchProducts,
  getNewArrivals,
  getProductsByPriceRange,
  updateStockQuantity,
  getProductsBelow499,
  getProductsByIds,
} from "../controllers/productController.js";

const router = express.Router();

// ========================================
// ⚠️ IMPORTANT: SPECIFIC ROUTES MUST COME BEFORE DYNAMIC ROUTES
// ========================================

// 🔍 SEARCH - Must come before /:id
router.get("/search/query", searchProducts);

// 🆕 NEW ARRIVALS - Must come before /:id
router.get("/newarrivals/all", getNewArrivals);

// 💰 PRICE RANGE - Must come before /:id
router.get("/price/range", getProductsByPriceRange);

// 💵 BELOW 499 - Must come before /:id
router.get("/below499", getProductsBelow499);

// 📦 BY COLLECTION - Must come before /:id
router.get("/collection/:collection", getProductsByCollection);

// ========================================
// 📦 BASIC CRUD ROUTES
// ========================================

// CREATE
router.post("/", createProduct);

// READ ALL
router.get("/", getAllProducts);

router.post("/batch", getProductsByIds);

// READ SINGLE (MUST BE AFTER ALL SPECIFIC ROUTES)
router.get("/:id", getProductById);

// UPDATE
router.put("/:id", updateProduct);

// SOFT DELETE
router.delete("/:id", deleteProduct);

// PERMANENT DELETE
router.delete("/:id/permanent", permanentlyDeleteProduct);

// ========================================
// 📊 STOCK MANAGEMENT
// ========================================
router.patch("/:id/stock", updateStockQuantity);

export default router;