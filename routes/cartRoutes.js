// routes/cartRoutes.js
import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
} from "../controllers/cartController.js";

const router = express.Router();

// ========================================
// 🛒 CART ROUTES
// ========================================

// GET - Get user's cart
// GET /api/cart/:userId
router.get("/:userId", getCart);

// GET - Get cart item count
// GET /api/cart/:userId/count
router.get("/:userId/count", getCartCount);

// POST - Add item to cart
// POST /api/cart/:userId/add
// Body: { productId, selectedSize, selectedColor, quantity }
router.post("/:userId/add", addToCart);

// PUT - Update cart item quantity
// PUT /api/cart/:userId/update/:itemIndex
// Body: { quantity }
router.put("/:userId/update/:itemIndex", updateCartItem);

// DELETE - Remove item from cart
// DELETE /api/cart/:userId/remove/:itemIndex
router.delete("/:userId/remove/:itemIndex", removeFromCart);

// DELETE - Clear entire cart
// DELETE /api/cart/:userId/clear
router.delete("/:userId/clear", clearCart);

export default router;