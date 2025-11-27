// config/razorpay.js
import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

// Initialize Razorpay instance
export const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Validate Razorpay configuration
export const validateRazorpayConfig = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("❌ Razorpay credentials are missing in .env file");
    return false;
  }
  console.log("✅ Razorpay configuration loaded successfully");
  return true;
};

export default razorpayInstance;