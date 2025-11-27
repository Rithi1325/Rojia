// routes/orderRoutes.js
import express from "express";
import {
  placeOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  createRazorpayOrder,      // ✅ NEW
  verifyRazorpayPayment,    // ✅ NEW
  placeOrderWithPayment,    // ✅ NEW
} from "../controllers/orderController.js";

const router = express.Router();

// @route   POST /api/orders/place
// @desc    Place a new order (COD or without payment verification)
// @access  Private
router.post("/place", placeOrder);

// ✅ NEW ROUTES FOR RAZORPAY INTEGRATION

// @route   POST /api/orders/create-razorpay-order
// @desc    Create Razorpay order before payment
// @access  Private
router.post("/create-razorpay-order", createRazorpayOrder);

// @route   POST /api/orders/verify-payment
// @desc    Verify Razorpay payment signature
// @access  Private
router.post("/verify-payment", verifyRazorpayPayment);

// @route   POST /api/orders/place-with-payment
// @desc    Place order after successful payment
// @access  Private
router.post("/place-with-payment", placeOrderWithPayment);

// EXISTING ROUTES

// @route   GET /api/orders/user/:userId
// @desc    Get all orders for a user
// @access  Private
router.get("/user/:userId", getUserOrders);

// @route   GET /api/orders/:orderId
// @desc    Get single order by order ID
// @access  Private
router.get("/:orderId", getOrderById);

// @route   PATCH /api/orders/:orderId/cancel
// @desc    Cancel an order
// @access  Private
router.patch("/:orderId/cancel", cancelOrder);

// @route   PATCH /api/orders/:orderId/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.patch("/:orderId/status", updateOrderStatus);

export default router;