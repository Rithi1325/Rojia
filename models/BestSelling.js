// models/BestSelling.js
import mongoose from "mongoose";

const bestSellingSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      unique: true, // Each product can only be in best selling once
      ref: "Product", // Reference to Product model
    },
    order: {
      type: Number,
      default: 0, // For manual ordering of best selling items
    },
    isActive: {
      type: Boolean,
      default: true, // Can be toggled on/off without removing
    },
    addedBy: {
      type: String,
      default: "admin",
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
bestSellingSchema.index({ productId: 1 });
bestSellingSchema.index({ isActive: 1 });
bestSellingSchema.index({ order: 1 });

// Static method to get all best selling products with full product details
// Static method to get all best selling products with full product details
bestSellingSchema.statics.getBestSellingWithProducts = async function () {
  const Product = mongoose.model("Product");

  // Get all active best selling entries
  const bestSellingItems = await this.find({ isActive: true })
    .sort({ order: 1, addedAt: -1 });

  // Get all product IDs
  const productIds = bestSellingItems.map(item => item.productId);

  // Fetch full product details
  const products = await Product.find({
    id: { $in: productIds },
    isActive: true
  }).lean(); // 👈 ADD .lean() to get plain JavaScript objects

  // Map products to best selling order
  const productsMap = new Map(products.map(p => [p.id, p]));

  const bestSellingWithProducts = bestSellingItems
    .map(item => {
      const product = productsMap.get(item.productId);
      if (!product) return null;

      // 👇 CONVERT stockDetails and colorImages Maps to Objects
      const productObj = {
        ...product,
        stockDetails: product.stockDetails ? Object.fromEntries(
          Object.entries(product.stockDetails).map(([key, value]) => [
            key,
            value instanceof Map ? Object.fromEntries(value) : value
          ])
        ) : {},
        colorImages: product.colorImages ?
          (product.colorImages instanceof Map ?
            Object.fromEntries(product.colorImages) :
            product.colorImages) : {},
        bestSellingOrder: item.order,
        bestSellingId: item._id,
      };

      return productObj;
    })
    .filter(item => item !== null);

  return bestSellingWithProducts;
};

const BestSelling = mongoose.model("BestSelling", bestSellingSchema);

export default BestSelling;