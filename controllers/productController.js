// controllers/productController.js
import Product from "../models/Product.js";

// 🔹 1. CREATE NEW PRODUCT
export const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Check if product ID already exists
    const existingProduct = await Product.findOne({ id: productData.id });
    if (existingProduct) {
      return res.status(400).json({ 
        message: "Product with this ID already exists" 
      });
    }

    // ✅ ENSURE isActive is true by default
    if (productData.isActive === undefined) {
      productData.isActive = true;
    }

    // Create new product
    const newProduct = new Product(productData);
    await newProduct.save();

    console.log("✅ Product created:", newProduct.id, "Collection:", newProduct.collection);

    res.status(201).json({
      message: "Product created successfully",
      product: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ 
      message: "Failed to create product", 
      error: error.message 
    });
  }
};

// 🔹 2. GET ALL PRODUCTS (with optional filters)
export const getAllProducts = async (req, res) => {
  try {
    const { 
      collection, 
      stock, 
      isActive, 
      limit, 
      skip,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter query
    const filter = {};
    
    // ✅ FIX: Case-insensitive collection search
    if (collection) {
      filter.collection = { $regex: new RegExp(`^${collection}$`, 'i') };
    }
    
    if (stock) filter.stock = stock;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    console.log("🔍 Fetching products with filter:", filter);

    // Execute query with pagination
    const products = await Product.find(filter)
      .sort(sortOptions)
      .limit(limit ? parseInt(limit) : 0)
      .skip(skip ? parseInt(skip) : 0);

    // Get total count for pagination
    const totalCount = await Product.countDocuments(filter);

    console.log(`✅ Found ${products.length} products (Total: ${totalCount})`);

    res.status(200).json({
      products,
      totalCount,
      currentPage: skip ? Math.floor(parseInt(skip) / parseInt(limit || 10)) + 1 : 1,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ 
      message: "Failed to fetch products", 
      error: error.message 
    });
  }
};

// 🔹 3. GET SINGLE PRODUCT BY ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    console.log("🔍 Fetching product with ID:", id);

    const product = await Product.findOne({ id: id });

    if (!product) {
      console.log("❌ Product not found:", id);
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("✅ Product found:", product.title);

    res.status(200).json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ 
      message: "Failed to fetch product", 
      error: error.message 
    });
  }
};

// 🔹 4. UPDATE PRODUCT
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove id from updateData if present (shouldn't be updated)
    delete updateData._id;
    delete updateData.id;

    console.log("🔄 Updating product:", id);

    const updatedProduct = await Product.findOneAndUpdate(
      { id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    console.log("✅ Product updated:", updatedProduct.title);

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ 
      message: "Failed to update product", 
      error: error.message 
    });
  }
};

// 🔹 5. DELETE PRODUCT (Soft delete - set isActive to false)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findOneAndUpdate(
      { id: id },
      { $set: { isActive: false } },
      { new: true }
    );

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ 
      message: "Failed to delete product", 
      error: error.message 
    });
  }
};

// 🔹 6. PERMANENTLY DELETE PRODUCT
export const permanentlyDeleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProduct = await Product.findOneAndDelete({ id: id });

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product permanently deleted",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("Error permanently deleting product:", error);
    res.status(500).json({ 
      message: "Failed to permanently delete product", 
      error: error.message 
    });
  }
};

// 🔹 7. GET PRODUCTS BY COLLECTION
// 🔹 7. GET PRODUCTS BY COLLECTION - ENHANCED
export const getProductsByCollection = async (req, res) => {
  try {
    const { collection } = req.params;

    console.log("🔍 Fetching products for collection:", collection);
    console.log("📊 Request params:", req.params);
    console.log("📊 Request query:", req.query);

    // ✅ Decode and clean the collection name
    const decodedCollection = decodeURIComponent(collection)
      .trim()
      .replace(/-/g, ' '); // Convert hyphens to spaces for URL-friendly names
    
    console.log("🔄 Decoded collection name:", decodedCollection);

    // ✅ Case-insensitive search with trimmed spaces
    const products = await Product.find({ 
      collection: { $regex: new RegExp(`^${decodedCollection.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isActive: true 
    }).sort({ createdAt: -1 });

    console.log(`✅ Found ${products.length} products in collection: "${decodedCollection}"`);

    // Log first product for debugging
    if (products.length > 0) {
      console.log("📦 Sample product:", {
        id: products[0].id,
        title: products[0].title,
        collection: products[0].collection
      });
    }

    res.status(200).json({ 
      success: true,
      products,
      count: products.length,
      collection: decodedCollection
    });
  } catch (error) {
    console.error("❌ Error fetching products by collection:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch products", 
      error: error.message 
    });
  }
};

// 🔹 8. SEARCH PRODUCTS
export const searchProducts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const products = await Product.find({
      isActive: true,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { collection: { $regex: query, $options: "i" } },
        { colors: { $regex: query, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

    res.status(200).json({ 
      products,
      count: products.length 
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ 
      message: "Failed to search products", 
      error: error.message 
    });
  }
};

// 🔹 9. GET NEW ARRIVALS (Latest products)
export const getNewArrivals = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({ 
      products,
      count: products.length 
    });
  } catch (error) {
    console.error("Error fetching new arrivals:", error);
    res.status(500).json({ 
      message: "Failed to fetch new arrivals", 
      error: error.message 
    });
  }
};

// 🔹 10. GET PRODUCTS BY PRICE RANGE
export const getProductsByPriceRange = async (req, res) => {
  try {
    const { min, max } = req.query;

    const filter = { isActive: true };
    
    if (min) filter.sellingPrice = { $gte: parseFloat(min) };
    if (max) {
      filter.sellingPrice = { 
        ...filter.sellingPrice, 
        $lte: parseFloat(max) 
      };
    }

    const products = await Product.find(filter).sort({ sellingPrice: 1 });

    res.status(200).json({ 
      products,
      count: products.length 
    });
  } catch (error) {
    console.error("Error fetching products by price:", error);
    res.status(500).json({ 
      message: "Failed to fetch products", 
      error: error.message 
    });
  }
};

// 🔹 11. UPDATE STOCK QUANTITY
export const updateStockQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, color, quantity } = req.body;

    const product = await Product.findOne({ id: id });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Update stock quantity for specific size and color
    if (!product.stockDetails) {
      product.stockDetails = new Map();
    }
    
    if (!product.stockDetails.get(size)) {
      product.stockDetails.set(size, new Map());
    }
    
    const sizeMap = product.stockDetails.get(size);
    const colorData = sizeMap.get(color) || {};
    colorData.quantity = quantity;
    sizeMap.set(color, colorData);

    await product.save();

    res.status(200).json({
      message: "Stock updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ 
      message: "Failed to update stock", 
      error: error.message 
    });
  }
};

// 📹 12. GET PRODUCTS BELOW 499
export const getProductsBelow499 = async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    console.log("🔍 Fetching products below ₹499");

    // Find products where sellingPrice is less than or equal to 499
    const products = await Product.find({ 
      isActive: true,
      sellingPrice: { $lte: 499 }
    })
      .sort({ sellingPrice: 1 }) // Sort by price (low to high)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const totalCount = await Product.countDocuments({ 
      isActive: true,
      sellingPrice: { $lte: 499 }
    });

    console.log(`✅ Found ${products.length} products below ₹499 (Total: ${totalCount})`);

    res.status(200).json({ 
      success: true,
      products,
      count: products.length,
      totalCount
    });
  } catch (error) {
    console.error("❌ Error fetching products below 499:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch products below ₹499", 
      error: error.message 
    });
  }
};

// 🔹 13. GET MULTIPLE PRODUCTS BY IDs (Batch Fetch for Wishlist/Cart)
export const getProductsByIds = async (req, res) => {
  try {
    const { ids } = req.body;

    // Validation
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Product IDs array is required" 
      });
    }

    console.log(`🔍 Fetching ${ids.length} products by IDs:`, ids);

    // Fetch products by custom 'id' field (not MongoDB _id)
    const products = await Product.find({ 
      id: { $in: ids },
      isActive: true 
    });

    if (products.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "No products found for the given IDs" 
      });
    }

    console.log(`✅ Found ${products.length} products out of ${ids.length} requested`);

    // Return products array directly (not wrapped in 'products' key for frontend compatibility)
    res.status(200).json(products);
  } catch (error) {
    console.error("❌ Error fetching products by IDs:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to fetch products", 
      error: error.message 
    });
  }
};