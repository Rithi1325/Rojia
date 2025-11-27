// controllers/searchController.js
import Product from '../models/Product.js';
import Collection from '../models/Collection.js';

// Smart search function
export const smartSearch = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const query = q.trim();
    
    console.log("🔍 Smart Search Query:", query);
    
    // ====================================
    // 1. CHECK FOR EXACT PRODUCT ID MATCH
    // ====================================
    const productById = await Product.findOne({ 
      id: query, 
      isActive: true 
    });
    
    if (productById) {
      console.log("✅ Found product by ID:", productById.id);
      return res.json({
        type: 'product',
        result: productById,
        redirectUrl: `/product/${productById.id}`
      });
    }
    
    // ====================================
    // 2. CHECK FOR COLLECTION NAME MATCH
    // ====================================
    
    // 🔹 Try exact match first (case-insensitive)
    let collection = await Collection.findOne({ 
      name: { $regex: `^${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      enabled: true 
    });
    
    console.log("🔍 Exact collection search for:", query);
    
    if (collection) {
      console.log("✅ Found collection (exact match):", collection.name);
      return res.json({
        type: 'collection',
        result: collection,
        redirectUrl: `/collection/${collection.normalizedName.replace(/_/g, '-')}` // ✅ Convert underscores to hyphens
      });
    }
    
    // 🔹 Try normalized name match (with spaces replaced by underscores)
    const normalizedQuery = query.replace(/\s+/g, '_');
    collection = await Collection.findOne({
      normalizedName: { $regex: `^${normalizedQuery}$`, $options: 'i' },
      enabled: true
    });
    
    if (collection) {
      console.log("✅ Found collection (normalized match):", collection.name);
      return res.json({
        type: 'collection',
        result: collection,
        redirectUrl: `/collection/${collection.normalizedName.replace(/_/g, '-')}` // ✅ Convert underscores to hyphens
      });
    }
    
    // 🔹 Try partial match as last resort for collections
    collection = await Collection.findOne({
      name: { $regex: query, $options: 'i' },
      enabled: true
    });

    if (collection) {
      console.log("✅ Found collection (partial match):", collection.name);
      return res.json({
        type: 'collection',
        result: collection,
        redirectUrl: `/collection/${collection.normalizedName.replace(/_/g, '-')}` // ✅ Convert underscores to hyphens
      });
    }
    
    // ====================================
    // 3. SEARCH FOR PRODUCTS BY TITLE
    // ====================================
    const productsByTitle = await Product.find({ 
      title: { $regex: query, $options: 'i' },
      isActive: true 
    }).limit(10);
    
    console.log(`📦 Found ${productsByTitle.length} products by title`);
    
    // If only one product matches, redirect to its detail page
    if (productsByTitle.length === 1) {
      console.log("✅ Single product match:", productsByTitle[0].title);
      return res.json({
        type: 'product',
        result: productsByTitle[0],
        redirectUrl: `/product/${productsByTitle[0].id}`
      });
    } 
    
    // If multiple products match, go to search results page
    if (productsByTitle.length > 1) {
      console.log("📋 Multiple products found, redirecting to search results");
      return res.json({
        type: 'products',
        results: productsByTitle,
        redirectUrl: `/search?q=${encodeURIComponent(query)}`
      });
    }
    
    // ====================================
    // 4. NO RESULTS FOUND
    // ====================================
    console.log("❌ No results found for:", query);
    return res.json({
      type: 'no-results',
      message: 'No products or collections found matching your search'
    });
    
  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error during search',
      error: error.message 
    });
  }
};