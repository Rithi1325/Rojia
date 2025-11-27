// models/Order.js - UPDATED WITH PAYMENT DETAILS
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    items: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        selectedSize: { type: String, required: true },
        selectedColor: { type: String, required: true },
        image: { type: String },
        collection: { type: String },
        originalPrice: { type: Number },
        discount: { type: Number },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["online", "cod"],
      default: "online",
    },
    // ✅ NEW: Payment Details for Razorpay
    paymentDetails: {
      razorpay_order_id: { type: String },
      razorpay_payment_id: { type: String },
      payment_status: { 
        type: String, 
        enum: ["pending", "completed", "failed"],
        default: "pending"
      },
      paid_at: { type: Date },
    },
    shippingAddress: {
      street: { type: String, required: true },
      village: { type: String, required: true },
      po: { type: String },
      taluk: { type: String },
      district: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      country: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["Order Placed", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Order Placed",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for faster queries
orderSchema.index({ userId: 1 });
orderSchema.index({ orderId: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ "paymentDetails.razorpay_payment_id": 1 }); // ✅ NEW INDEX

const Order = mongoose.model("Order", orderSchema);

export default Order;