// controllers/wishlistController.js
import Wishlist from "../models/Wishlist.js";


export const getWishlist = async (req, res) => {
  try {
    const wishlist = (await Wishlist.findOne({ user: req.user._id })) || { products: [] };
    return res.json({ products: wishlist.products.map(p => p.productId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const addToWishlist = async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: "productId required" });

  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    if (!wishlist.products.some(p => p.productId === productId)) {
      wishlist.products.push({ productId });
      await wishlist.save();
    }

    return res.status(200).json({ products: wishlist.products.map(p => p.productId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeFromWishlist = async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: "productId required" });

  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) return res.status(200).json({ products: [] });

    wishlist.products = wishlist.products.filter(p => p.productId !== productId);
    await wishlist.save();
    return res.status(200).json({ products: wishlist.products.map(p => p.productId) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const toggleWishlist = async (req, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ message: "productId required" });

  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, products: [] });
    }

    const exists = wishlist.products.some(p => p.productId === productId);
    if (exists) {
      wishlist.products = wishlist.products.filter(p => p.productId !== productId);
    } else {
      wishlist.products.push({ productId });
    }
    await wishlist.save();
    return res.json({ products: wishlist.products.map(p => p.productId), isWishlisted: !exists });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const clearWishlist = async (req, res) => {
  try {
    await Wishlist.findOneAndUpdate({ user: req.user._id }, { products: [] }, { upsert: true });
    return res.json({ products: [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
