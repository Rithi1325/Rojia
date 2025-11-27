// controllers/orderController.js - WITH RAZORPAY INTEGRATION
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import crypto from "crypto"; // ✅ NEW IMPORT
import razorpayInstance from "../config/razorpay.js"; // ✅ NEW IMPORT

// Generate unique order ID
const generateOrderId = () => {
  const timestamp = Date.now().toString().slice(-8);
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `CKT_${timestamp}_${randomNum}`;
};

// @desc    Place a new order
// @route   POST /api/orders/place
// @access  Private
export const placeOrder = async (req, res) => {
  try {
    const { userId, items, totalAmount, paymentMethod, shippingAddress } = req.body;

    // Validation
    if (!userId || !items || items.length === 0 || !totalAmount || !shippingAddress) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate shipping address
    const { street, village, district, state, pincode, country } = shippingAddress;
    if (!street || !village || !district || !state || !pincode || !country) {
      return res.status(400).json({ message: "Incomplete shipping address" });
    }

    // ✅ FIX: Check stock availability and update stock
    for (const item of items) {
      // ✅ FIX: Use item.id (which now comes from frontend mapping)
      const productId = item.id || item.productId;
      
      if (!productId) {
        console.error("❌ Item missing ID:", item);
        return res.status(400).json({ 
          message: `Product ID missing for item: ${item.title}` 
        });
      }

      console.log("🔍 Looking for product with id:", productId);
      const product = await Product.findOne({ id: productId });

      if (!product) {
        console.error("❌ Product not found:", productId);
        return res.status(404).json({ 
          message: `Product not found: ${item.title}` 
        });
      }

      console.log("✅ Found product:", product.title);

      // Check if stockDetails exists
      if (!product.stockDetails || !product.stockDetails.get(item.selectedSize)) {
        return res.status(400).json({ 
          message: `Size ${item.selectedSize} not available for ${product.title}` 
        });
      }

      const sizeStock = product.stockDetails.get(item.selectedSize);
      const colorStock = sizeStock.get(item.selectedColor);
      
      if (!colorStock) {
        return res.status(400).json({ 
          message: `Color ${item.selectedColor} not available for ${product.title}` 
        });
      }

      const availableQuantity = parseInt(colorStock.quantity, 10) || 0;

      if (availableQuantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.title}. Available: ${availableQuantity}, Requested: ${item.quantity}` 
        });
      }

      // Update stock
      const newQuantity = availableQuantity - item.quantity;
      colorStock.quantity = newQuantity;
      sizeStock.set(item.selectedColor, colorStock);
      product.stockDetails.set(item.selectedSize, sizeStock);

      // Update main stock status
      if (newQuantity === 0) {
        product.stock = "Out of Stock";
      } else if (newQuantity < 5) {
        product.stock = "Low Stock";
      }

      await product.save();
      console.log(`✅ Updated stock for ${product.title}: ${availableQuantity} -> ${newQuantity}`);
    }

    // Generate order ID
    const orderId = generateOrderId();

    // Get user details from request
    const userEmail = req.body.userEmail || req.user?.email || "N/A";
    const userName = req.body.userName || req.user?.name || "Customer";

    // Create order
    const newOrder = new Order({
      orderId,
      userId,
      userEmail,
      userName,
      items,
      totalAmount,
      paymentMethod: paymentMethod || "online",
      shippingAddress,
      status: "Order Placed",
      statusHistory: [
        {
          status: "Order Placed",
          timestamp: new Date(),
          note: "Order placed by user",
        },
      ],
    });

    await newOrder.save();
    console.log("✅ Order created successfully:", orderId);

    // Clear user's cart after successful order
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalPrice: 0 },
      { new: true }
    );
    console.log("✅ Cart cleared for user:", userId);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId,
      order: newOrder,
    });

  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.status(500).json({ 
      message: "Failed to place order", 
      error: error.message 
    });
  }
};

// @desc    Get all orders for a user
// @route   GET /api/orders/user/:userId
// @access  Private
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ 
      message: "Failed to fetch orders", 
      error: error.message 
    });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:orderId
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("❌ Error fetching order:", error);
    res.status(500).json({ 
      message: "Failed to fetch order", 
      error: error.message 
    });
  }
};

// @desc    Cancel an order
// @route   PATCH /api/orders/:orderId/cancel
// @access  Private
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // ✅ FIXED: Changed from findOne to findById
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({ message: "Order already cancelled" });
    }

    if (order.status === "Shipped" || order.status === "Delivered") {
      return res.status(400).json({ 
        message: "Cannot cancel order that has been shipped or delivered" 
      });
    }

    // Restore stock
    for (const item of order.items) {
      const productId = item.id || item.productId;
      const product = await Product.findOne({ id: productId });
      
      if (product && product.stockDetails) {
        const sizeStock = product.stockDetails.get(item.selectedSize);
        if (sizeStock) {
          const colorStock = sizeStock.get(item.selectedColor);
          if (colorStock) {
            const currentQty = parseInt(colorStock.quantity, 10) || 0;
            colorStock.quantity = currentQty + item.quantity;
            sizeStock.set(item.selectedColor, colorStock);
            product.stockDetails.set(item.selectedSize, sizeStock);
            
            // Update stock status
            if (colorStock.quantity > 0) {
              product.stock = colorStock.quantity < 5 ? "Low Stock" : "In Stock";
            }

            await product.save();
            console.log(`✅ Restored stock for ${product.title}`);
          }
        }
      }
    }

    order.status = "Cancelled";
    order.statusHistory.push({
      status: "Cancelled",
      timestamp: new Date(),
      note: "Order cancelled by user",
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    console.error("❌ Error cancelling order:", error);
    res.status(500).json({ 
      message: "Failed to cancel order", 
      error: error.message 
    });
  }
};

// @desc    Update order status (Admin)
// @route   PATCH /api/orders/:orderId/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const validStatuses = ["Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // ✅ FIXED: Changed from findOne to findById
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Order status updated to ${status}`,
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("❌ Error updating order status:", error);
    res.status(500).json({ 
      message: "Failed to update order status", 
      error: error.message 
    });
  }
};

// ========================================
// ✅ NEW RAZORPAY PAYMENT FUNCTIONS
// ========================================

// @desc    Create Razorpay order
// @route   POST /api/orders/create-razorpay-order
// @access  Private
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    // Razorpay expects amount in paise (smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    console.log("✅ Razorpay order created:", razorpayOrder.id);

    res.status(200).json({
      success: true,
      order: razorpayOrder,
      key_id: process.env.RAZORPAY_KEY_ID, // Send key_id to frontend
    });

  } catch (error) {
    console.error("❌ Error creating Razorpay order:", error);
    res.status(500).json({ 
      message: "Failed to create Razorpay order", 
      error: error.message 
    });
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/orders/verify-payment
// @access  Private
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ 
        message: "Missing payment verification parameters" 
      });
    }

    // Create signature for verification
    const text = razorpay_order_id + "|" + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest("hex");

    // Verify signature
    if (generated_signature === razorpay_signature) {
      console.log("✅ Payment verified successfully");
      
      res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      console.error("❌ Payment verification failed - Invalid signature");
      
      res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

  } catch (error) {
    console.error("❌ Error verifying payment:", error);
    res.status(500).json({ 
      message: "Payment verification failed", 
      error: error.message 
    });
  }
};

// @desc    Place order after successful payment
// @route   POST /api/orders/place-with-payment
// @access  Private
export const placeOrderWithPayment = async (req, res) => {
  try {
    const { 
      userId, 
      items, 
      totalAmount, 
      paymentMethod, 
      shippingAddress,
      paymentDetails // Contains razorpay_payment_id, razorpay_order_id
    } = req.body;

    // Validation
    if (!userId || !items || items.length === 0 || !totalAmount || !shippingAddress) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate shipping address
    const { street, village, district, state, pincode, country } = shippingAddress;
    if (!street || !village || !district || !state || !pincode || !country) {
      return res.status(400).json({ message: "Incomplete shipping address" });
    }

    // If online payment, validate payment details
    if (paymentMethod === "online" && (!paymentDetails || !paymentDetails.razorpay_payment_id)) {
      return res.status(400).json({ message: "Payment details are required for online payment" });
    }

    // Check stock availability and update stock
    for (const item of items) {
      const productId = item.id || item.productId;
      
      if (!productId) {
        console.error("❌ Item missing ID:", item);
        return res.status(400).json({ 
          message: `Product ID missing for item: ${item.title}` 
        });
      }

      const product = await Product.findOne({ id: productId });

      if (!product) {
        console.error("❌ Product not found:", productId);
        return res.status(404).json({ 
          message: `Product not found: ${item.title}` 
        });
      }

      // Check if stockDetails exists
      if (!product.stockDetails || !product.stockDetails.get(item.selectedSize)) {
        return res.status(400).json({ 
          message: `Size ${item.selectedSize} not available for ${product.title}` 
        });
      }

      const sizeStock = product.stockDetails.get(item.selectedSize);
      const colorStock = sizeStock.get(item.selectedColor);
      
      if (!colorStock) {
        return res.status(400).json({ 
          message: `Color ${item.selectedColor} not available for ${product.title}` 
        });
      }

      const availableQuantity = parseInt(colorStock.quantity, 10) || 0;

      if (availableQuantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.title}. Available: ${availableQuantity}, Requested: ${item.quantity}` 
        });
      }

      // Update stock
      const newQuantity = availableQuantity - item.quantity;
      colorStock.quantity = newQuantity;
      sizeStock.set(item.selectedColor, colorStock);
      product.stockDetails.set(item.selectedSize, sizeStock);

      // Update main stock status
      if (newQuantity === 0) {
        product.stock = "Out of Stock";
      } else if (newQuantity < 5) {
        product.stock = "Low Stock";
      }

      await product.save();
      console.log(`✅ Updated stock for ${product.title}: ${availableQuantity} -> ${newQuantity}`);
    }

    // Generate order ID
    const orderId = generateOrderId();

    // Get user details from request
    const userEmail = req.body.userEmail || req.user?.email || "N/A";
    const userName = req.body.userName || req.user?.name || "Customer";

    // Create order
    const newOrder = new Order({
      orderId,
      userId,
      userEmail,
      userName,
      items,
      totalAmount,
      paymentMethod: paymentMethod || "online",
      paymentDetails: paymentMethod === "online" ? {
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        razorpay_order_id: paymentDetails.razorpay_order_id,
        payment_status: "completed",
        paid_at: new Date()
      } : undefined,
      shippingAddress,
      status: "Order Placed",
      statusHistory: [
        {
          status: "Order Placed",
          timestamp: new Date(),
          note: paymentMethod === "online" 
            ? `Order placed with online payment (${paymentDetails.razorpay_payment_id})`
            : "Order placed by user",
        },
      ],
    });

    await newOrder.save();
    console.log("✅ Order created successfully:", orderId);

    // Clear user's cart after successful order
    await Cart.findOneAndUpdate(
      { userId },
      { items: [], totalPrice: 0 },
      { new: true }
    );
    console.log("✅ Cart cleared for user:", userId);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      orderId,
      order: newOrder,
    });

  } catch (error) {
    console.error("❌ Error placing order:", error);
    res.status(500).json({ 
      message: "Failed to place order", 
      error: error.message 
    });
  }
};