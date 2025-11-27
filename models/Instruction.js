// models/Instruction.js
import mongoose from "mongoose";

const instructionSchema = new mongoose.Schema(
  {
    // Instruction ID (like CC-123456)
    id: {
      type: String,
      required: true,
      unique: true,
    },
    
    // Main Heading
    heading: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Subheadings array
    subheadings: [
      {
        subheading: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    
    // Active status
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Created by
    createdBy: {
      type: String,
      default: "admin",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Index for faster queries
instructionSchema.index({ id: 1 });
instructionSchema.index({ isActive: 1 });

const Instruction = mongoose.model("Instruction", instructionSchema);

export default Instruction;