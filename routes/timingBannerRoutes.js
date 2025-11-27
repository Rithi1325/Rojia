// routes/timingBannerRoutes.js
import express from "express";
import {
  createOrUpdateTimingBanner,
  getTimingBanner,
} from "../controllers/timingBannerController.js";

const router = express.Router();

router.post("/", createOrUpdateTimingBanner);
router.get("/", getTimingBanner);

export default router;
