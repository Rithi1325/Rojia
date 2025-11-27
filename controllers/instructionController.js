// controllers/instructionController.js
import Instruction from "../models/Instruction.js";

// 📹 1. CREATE NEW INSTRUCTION
export const createInstruction = async (req, res) => {
  try {
    const instructionData = req.body;

    // Check if instruction ID already exists
    const existingInstruction = await Instruction.findOne({ id: instructionData.id });
    if (existingInstruction) {
      return res.status(400).json({ 
        message: "Instruction with this ID already exists" 
      });
    }

    // Ensure isActive is true by default
    if (instructionData.isActive === undefined) {
      instructionData.isActive = true;
    }

    // Create new instruction
    const newInstruction = new Instruction(instructionData);
    await newInstruction.save();

    console.log("✅ Instruction created:", newInstruction.id);

    res.status(201).json({
      message: "Instruction created successfully",
      instruction: newInstruction,
    });
  } catch (error) {
    console.error("Error creating instruction:", error);
    res.status(500).json({ 
      message: "Failed to create instruction", 
      error: error.message 
    });
  }
};

// 📹 2. GET ALL INSTRUCTIONS
export const getAllInstructions = async (req, res) => {
  try {
    const { isActive } = req.query;

    // Build filter query
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    console.log("🔍 Fetching instructions with filter:", filter);

    // Execute query
    const instructions = await Instruction.find(filter).sort({ createdAt: -1 });

    console.log(`✅ Found ${instructions.length} instructions`);

    res.status(200).json({
      instructions,
      count: instructions.length,
    });
  } catch (error) {
    console.error("Error fetching instructions:", error);
    res.status(500).json({ 
      message: "Failed to fetch instructions", 
      error: error.message 
    });
  }
};

// 📹 3. GET SINGLE INSTRUCTION BY ID
export const getInstructionById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 Fetching instruction with ID:", id);

    const instruction = await Instruction.findOne({ id: id });

    if (!instruction) {
      console.log("❌ Instruction not found:", id);
      return res.status(404).json({ message: "Instruction not found" });
    }

    console.log("✅ Instruction found:", instruction.heading);

    res.status(200).json({ instruction });
  } catch (error) {
    console.error("Error fetching instruction:", error);
    res.status(500).json({ 
      message: "Failed to fetch instruction", 
      error: error.message 
    });
  }
};

// 📹 4. UPDATE INSTRUCTION
export const updateInstruction = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove id from updateData if present
    delete updateData._id;
    delete updateData.id;

    console.log("🔄 Updating instruction:", id);

    const updatedInstruction = await Instruction.findOneAndUpdate(
      { id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedInstruction) {
      return res.status(404).json({ message: "Instruction not found" });
    }

    console.log("✅ Instruction updated:", updatedInstruction.heading);

    res.status(200).json({
      message: "Instruction updated successfully",
      instruction: updatedInstruction,
    });
  } catch (error) {
    console.error("Error updating instruction:", error);
    res.status(500).json({ 
      message: "Failed to update instruction", 
      error: error.message 
    });
  }
};

// 📹 5. DELETE INSTRUCTION (Soft delete)
export const deleteInstruction = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Soft deleting instruction:", id);

    const deletedInstruction = await Instruction.findOneAndUpdate(
      { id: id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!deletedInstruction) {
      return res.status(404).json({ message: "Instruction not found" });
    }

    console.log("✅ Instruction soft deleted:", id);

    res.status(200).json({
      message: "Instruction deleted successfully",
      instruction: deletedInstruction,
    });
  } catch (error) {
    console.error("Error deleting instruction:", error);
    res.status(500).json({ 
      message: "Failed to delete instruction", 
      error: error.message 
    });
  }
};

// 📹 6. PERMANENTLY DELETE INSTRUCTION
export const permanentlyDeleteInstruction = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🗑️ Permanently deleting instruction:", id);

    const deletedInstruction = await Instruction.findOneAndDelete({ id: id });

    if (!deletedInstruction) {
      return res.status(404).json({ message: "Instruction not found" });
    }

    console.log("✅ Instruction permanently deleted:", id);

    res.status(200).json({
      message: "Instruction permanently deleted",
      instruction: deletedInstruction,
    });
  } catch (error) {
    console.error("Error permanently deleting instruction:", error);
    res.status(500).json({ 
      message: "Failed to permanently delete instruction", 
      error: error.message 
    });
  }
};