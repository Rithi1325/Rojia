// routes/addressRoutes.js
import express from "express";
import { getAddress, saveAddress, deleteAddress } from "../controllers/addressController.js";
import { protect } from "../middleware/authMiddleware.js"; // Your existing auth middleware

const router = express.Router();

// All routes are protected (user must be logged in)
router.get("/", protect, getAddress);
router.post("/", protect, saveAddress);
router.delete("/", protect, deleteAddress);

export default router;