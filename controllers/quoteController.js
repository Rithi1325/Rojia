// controllers/quoteController.js
import Quote from "../models/Quote.js";

// CREATE a new quote
export const createQuote = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Quote text is required" });
    }

    const newQuote = await Quote.create({ text: text.trim() });

    res.status(201).json({
      message: "Quote added successfully",
      quote: newQuote,
    });

  } catch (error) {
    console.error("Create Quote Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// GET all quotes
export const getAllQuote = async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ createdAt: -1 });
    res.status(200).json(quotes);
  } catch (error) {
    console.error("Get Quotes Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// UPDATE a quote
export const updateQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const updated = await Quote.findByIdAndUpdate(
      id,
      { text },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json({ message: "Quote updated", quote: updated });

  } catch (error) {
    console.error("Update Quote Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// DELETE a quote
export const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Quote.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json({ message: "Quote deleted successfully" });

  } catch (error) {
    console.error("Delete Quote Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// CLEAR ALL QUOTES
export const clearAllQuotes = async (req, res) => {
  try {
    await Quote.deleteMany({});
    res.json({ message: "All quotes cleared!" });
  } catch (error) {
    console.error("Clear Quotes Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
