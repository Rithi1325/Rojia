// controllers/bestSellingController.js
import BestSelling from "../models/BestSelling.js";
import Product from "../models/Product.js";

// 🔧 HELPER FUNCTION: Convert Maps to Objects
const convertMapsToObjects = (product) => {
  const productObj = product.toObject ? product.toObject() : product;

  return {
    ...productObj,
    stockDetails: productObj.stockDetails
      ? Object.fromEntries(
          Object.entries(productObj.stockDetails).map(([key, value]) => [
            key,
            value instanceof Map ? Object.fromEntries(value) : value,
          ])
        )
      : {},
    colorImages: productObj.colorImages
      ? productObj.colorImages instanceof Map
        ? Object.fromEntries(productObj.colorImages)
        : productObj.colorImages
      : {},
  };
};

// ========================================
// 1️⃣ GET ALL BEST SELLING PRODUCTS (with full product details)
// ========================================
export const getAllBestSelling = async (req, res) => {
  try {
    console.log("📦 Fetching all best selling products...");

    // Use the static method to get best selling with product details
    const bestSellingProducts = await BestSelling.getBestSellingWithProducts();

    console.log(`✅ Found ${bestSellingProducts.length} best selling products`);

    res.status(200).json({
      success: true,
      products: bestSellingProducts,
      count: bestSellingProducts.length,
    });
  } catch (error) {
    console.error("❌ Error fetching best selling:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch best selling products",
      error: error.message,
    });
  }
};

// ========================================
// 2️⃣ ADD PRODUCT TO BEST SELLING
// ========================================
export const addToBestSelling = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    console.log("➕ Adding product to best selling:", productId);

    // Check if product exists and is active
    const product = await Product.findOne({ id: productId, isActive: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    // Check if already in best selling
    const existing = await BestSelling.findOne({ productId });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Product is already in best selling list",
      });
    }

    // Get the highest order number to add at the end
    const lastItem = await BestSelling.findOne().sort({ order: -1 });
    const newOrder = lastItem ? lastItem.order + 1 : 0;

    // Create new best selling entry
    const bestSellingItem = await BestSelling.create({
      productId,
      order: newOrder,
      isActive: true,
    });

    console.log("✅ Product added to best selling:", productId);

    // 👇 Convert Maps to Objects
    const productWithDetails = {
      ...convertMapsToObjects(product),
      bestSellingOrder: bestSellingItem.order,
      bestSellingId: bestSellingItem._id,
    };

    res.status(201).json({
      success: true,
      message: "Product added to best selling",
      product: productWithDetails,
    });
  } catch (error) {
    console.error("❌ Error adding to best selling:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add product to best selling",
      error: error.message,
    });
  }
};

// ========================================
// 3️⃣ REMOVE PRODUCT FROM BEST SELLING
// ========================================
export const removeFromBestSelling = async (req, res) => {
  try {
    const { productId } = req.params;

    console.log("🗑️ Removing product from best selling:", productId);

    const deleted = await BestSelling.findOneAndDelete({ productId });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Product not found in best selling list",
      });
    }

    console.log("✅ Product removed from best selling:", productId);

    res.status(200).json({
      success: true,
      message: "Product removed from best selling",
      productId,
    });
  } catch (error) {
    console.error("❌ Error removing from best selling:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove product from best selling",
      error: error.message,
    });
  }
};

// ========================================
// 4️⃣ TOGGLE BEST SELLING STATUS (Active/Inactive)
// ========================================
export const toggleBestSellingStatus = async (req, res) => {
  try {
    const { productId } = req.params;

    console.log("🔄 Toggling best selling status:", productId);

    const item = await BestSelling.findOne({ productId });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product not found in best selling list",
      });
    }

    item.isActive = !item.isActive;
    await item.save();

    console.log(`✅ Best selling status toggled to: ${item.isActive}`);

    res.status(200).json({
      success: true,
      message: `Best selling ${item.isActive ? "activated" : "deactivated"}`,
      isActive: item.isActive,
    });
  } catch (error) {
    console.error("❌ Error toggling best selling status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle best selling status",
      error: error.message,
    });
  }
};

// ========================================
// 5️⃣ UPDATE BEST SELLING ORDER (Reordering)
// ========================================
export const updateBestSellingOrder = async (req, res) => {
  try {
    const { items } = req.body; // Array of { productId, order }

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: "Items array is required",
      });
    }

    console.log("📊 Updating best selling order for", items.length, "items");

    // Update each item's order
    const updatePromises = items.map(({ productId, order }) =>
      BestSelling.findOneAndUpdate(
        { productId },
        { $set: { order } },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    console.log("✅ Best selling order updated");

    res.status(200).json({
      success: true,
      message: "Best selling order updated successfully",
    });
  } catch (error) {
    console.error("❌ Error updating best selling order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update best selling order",
      error: error.message,
    });
  }
};

// ========================================
// 6️⃣ CLEAR ALL BEST SELLING (Admin utility)
// ========================================
export const clearAllBestSelling = async (req, res) => {
  try {
    console.log("🧹 Clearing all best selling products...");

    const result = await BestSelling.deleteMany({});

    console.log(`✅ Deleted ${result.deletedCount} best selling items`);

    res.status(200).json({
      success: true,
      message: `Cleared ${result.deletedCount} best selling items`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("❌ Error clearing best selling:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear best selling",
      error: error.message,
    });
  }
};

// ========================================
// 7️⃣ SYNC BEST SELLING (Remove products that are deleted/inactive)
// ========================================
export const syncBestSelling = async (req, res) => {
  try {
    console.log("🔄 Syncing best selling with products...");

    // Get all best selling items
    const bestSellingItems = await BestSelling.find();
    const productIds = bestSellingItems.map((item) => item.productId);

    // Find active products
    const activeProducts = await Product.find({
      id: { $in: productIds },
      isActive: true,
    });

    const activeProductIds = new Set(activeProducts.map((p) => p.id));

    // Remove best selling items whose products are inactive/deleted
    const itemsToRemove = bestSellingItems.filter(
      (item) => !activeProductIds.has(item.productId)
    );

    if (itemsToRemove.length > 0) {
      await BestSelling.deleteMany({
        productId: { $in: itemsToRemove.map((item) => item.productId) },
      });

      console.log(`✅ Removed ${itemsToRemove.length} inactive best selling items`);
    } else {
      console.log("✅ All best selling items are in sync");
    }

    res.status(200).json({
      success: true,
      message: "Best selling synced successfully",
      removedCount: itemsToRemove.length,
    });
  } catch (error) {
    console.error("❌ Error syncing best selling:", error);
    res.status(500).json({
      success: false,
      message: "Failed to sync best selling",
      error: error.message,
    });
  }
};