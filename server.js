// server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { initializeTwilio } from "./config/authConfig.js";
import { validateRazorpayConfig } from "./config/razorpay.js"; // ✅ NEW IMPORT

// Routes
import authRoutes from "./routes/auth.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import navRoutes from "./routes/navRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import bestSellingRoutes from "./routes/bestsellingRoutes.js";
import instructionRoutes from "./routes/instructionRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import timingBannerRoutes from "./routes/timingBannerRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Twilio
initializeTwilio();

// ✅ NEW: Validate Razorpay Configuration
validateRazorpayConfig();

const app = express();

// Fix payload-limit issues (413 errors)
app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const corsOptions = {
  origin: 'http://localhost:5173',  // Explicitly allow the frontend URL
  credentials: true,  // Allow credentials (cookies, HTTP authentication)
};

// CORS
app.use(cors(corsOptions));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/navbar", navRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/products", productRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/bestselling", bestSellingRoutes);
app.use("/api/instructions", instructionRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/timing-banner", timingBannerRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);

export default app;