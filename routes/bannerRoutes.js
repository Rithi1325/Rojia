// routes/bannerRoutes.js
import express from "express";
import {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from "../controllers/bannerController.js";

const router = express.Router();

// GET all banners & POST new banners
router.route("/").get(getBanners)
router.route('/createBanner').post(createBanner);

// Update link or delete banner
router.route("/:id").put(updateBanner).delete(deleteBanner);

export default router;
