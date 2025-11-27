import express from "express";
import {
  createMedia,
  getMedia,
  updateMedia,
  deleteMedia,
} from "../controllers/mediaController.js";

const router = express.Router();

// CREATE
router.post("/", createMedia);

// GET ALL
router.get("/", getMedia);

// UPDATE
router.put("/:id", updateMedia);

// DELETE
router.delete("/:id", deleteMedia);

export default router;
