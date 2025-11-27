// routes/quoteRoutes.js
import express from "express";
import {
  createQuote,
  getAllQuote,
  updateQuote,
  deleteQuote,
  clearAllQuotes,
} from "../controllers/quoteController.js";

const router = express.Router();

// POST → Create quote
router.post("/", createQuote);

// GET → All quotes
router.get("/", getAllQuote);

// PUT → Edit a specific quote
router.put("/:id", updateQuote);

// DELETE → Delete specific quote
router.delete("/:id", deleteQuote);

// DELETE → Clear ALL quotes
router.delete("/", clearAllQuotes);

export default router;
