// routes/instructionRoutes.js
import express from "express";
import {
  createInstruction,
  getAllInstructions,
  getInstructionById,
  updateInstruction,
  deleteInstruction,
  permanentlyDeleteInstruction,
} from "../controllers/instructionController.js";

const router = express.Router();

// ========================================
// 📦 INSTRUCTION CRUD ROUTES
// ========================================

// CREATE - Add new instruction
// POST /api/instructions
router.post("/", createInstruction);

// READ - Get all instructions with optional filter
// GET /api/instructions?isActive=true
router.get("/", getAllInstructions);

// READ - Get single instruction by ID
// GET /api/instructions/:id
router.get("/:id", getInstructionById);

// UPDATE - Update instruction details
// PUT /api/instructions/:id
router.put("/:id", updateInstruction);

// DELETE - Soft delete (set isActive = false)
// DELETE /api/instructions/:id
router.delete("/:id", deleteInstruction);

// DELETE - Permanent delete
// DELETE /api/instructions/:id/permanent
router.delete("/:id/permanent", permanentlyDeleteInstruction);

export default router;