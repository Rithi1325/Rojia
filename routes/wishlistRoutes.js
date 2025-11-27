// routes/wishlistRoutes.js
import express from "express";
import Wishlist from "../models/Wishlist.js";

const router = express.Router();

// Middleware to get a userId from the request for this example
// In a real app, this would come from a verified JWT token
const getUserId = (req, res, next) => {
  req.userId = req.headers["x-user-id"] || "guest_user_123";
  next();
};

router.use(getUserId);

// GET /api/wishlist - Fetch all product IDs in the user's wishlist
router.get("/", async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.userId });
    res.json({ products: wishlist ? wishlist.products : [] });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/wishlist/add - Add a product to the wishlist
router.post("/add", async (req, res) => {
  try {
    const { productId } = req.body;
    const wishlist = await Wishlist.findOneAndUpdate(
      { userId: req.userId },
      { $addToSet: { products: productId } }, // $addToSet prevents duplicates
      { upsert: true, new: true } // upsert creates if not found, new returns the updated doc
    );
    res.json({ products: wishlist.products });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Server error." });
  }
});

// POST /api/wishlist/remove - Remove a product from the wishlist
router.post("/remove", async (req, res) => {
    try {
        const { productId } = req.body;
        const wishlist = await Wishlist.findOneAndUpdate(
            { userId: req.userId },
            { $pull: { products: productId } }, // $pull removes an item from an array
            { new: true }
        );
        res.json({ products: wishlist ? wishlist.products : [] });
    } catch (error) {
        console.error("Error removing from wishlist:", error);
        res.status(500).json({ message: "Server error." });
    }
});

// POST /api/wishlist/toggle - Add or remove a product
router.post("/toggle", async (req, res) => {
    try {
        const { productId } = req.body;
        let wishlist = await Wishlist.findOne({ userId: req.userId });
        let isWishlisted = false;

        if (!wishlist) {
            // If no wishlist, create one with the product
            wishlist = await Wishlist.create({ userId: req.userId, products: [productId] });
            isWishlisted = true;
        } else {
            const productIndex = wishlist.products.indexOf(productId);
            if (productIndex > -1) {
                // Product exists, so remove it
                wishlist.products.splice(productIndex, 1);
                isWishlisted = false;
            } else {
                // Product doesn't exist, so add it
                wishlist.products.push(productId);
                isWishlisted = true;
            }
            await wishlist.save();
        }
        
        res.json({ products: wishlist.products, isWishlisted });
    } catch (error) {
        console.error("Error toggling wishlist:", error);
        res.status(500).json({ message: "Server error." });
    }
});

export default router;