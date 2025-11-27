import Collection from '../models/Collection.js';

// Normalize name helper (spaces to underscores)
const normalizeName = (str) => str.trim().replace(/\s+/g, '_');

// Format name helper (underscores to spaces)
const formatName = (str) => str.replace(/_/g, ' ');

// ========================
// GET ALL COLLECTIONS
// ========================
export const getAllCollections = async (req, res) => {
  try {
    const collections = await Collection.find().sort({ order: 1, createdAt: 1 });

    res.status(200).json({
      success: true,
      data: collections,
    });
  } catch (error) {
    console.error('❌ Get All Collections Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ========================
// GET ENABLED COLLECTIONS (For frontend display)
// ========================
export const getEnabledCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ enabled: true }).sort({
      order: 1,
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      data: collections,
    });
  } catch (error) {
    console.error('❌ Get Enabled Collections Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enabled collections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ========================
// 🆕 GET OFFER COLLECTIONS (enabled + offerEnabled)
// ========================
export const getOfferCollections = async (req, res) => {
  try {
    const collections = await Collection.find({ 
      enabled: true, 
      offerEnabled: true 
    }).sort({
      order: 1,
      createdAt: 1,
    });

    res.status(200).json({
      success: true,
      data: collections,
    });
  } catch (error) {
    console.error('❌ Get Offer Collections Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offer collections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ========================
// GET SINGLE COLLECTION BY NAME
// ========================
export const getCollectionByName = async (req, res) => {
  try {
    const { name } = req.params;
    const normalizedName = normalizeName(name.replace(/-/g, ' '));

    const collection = await Collection.findOne({ normalizedName });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    res.status(200).json({
      success: true,
      data: collection,
    });
  } catch (error) {
    console.error('❌ Get Collection By Name Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch collection',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ========================
// CREATE COLLECTION
// ========================
export const createCollection = async (req, res) => {
  try {
    const { name, enabled = true, image = '', offerEnabled = false, isDefault = false } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required',
      });
    }

    const normalizedName = normalizeName(name);

    // Check if collection already exists
    const existingCollection = await Collection.findOne({ normalizedName });
    if (existingCollection) {
      return res.status(409).json({
        success: false,
        message: 'Collection already exists',
      });
    }

    // Get the highest order number
    const lastCollection = await Collection.findOne().sort({ order: -1 });
    const order = lastCollection ? lastCollection.order + 1 : 0;

    const collection = await Collection.create({
      name: formatName(normalizedName),
      normalizedName,
      enabled,
      image,
      offerEnabled,
      isDefault,
      order,
    });

    console.log('✅ Collection created:', collection.name);

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: collection,
    });
  } catch (error) {
    console.error('❌ Create Collection Error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Collection already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create collection',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ========================
// UPDATE COLLECTION
// ========================
export const updateCollection = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, enabled, image, offerEnabled, order } = req.body;

    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) {
      const normalizedName = normalizeName(name);
      
      // Check if new name conflicts with existing collection
      const existingCollection = await Collection.findOne({
        normalizedName,
        _id: { $ne: id },
      });
      
      if (existingCollection) {
        return res.status(409).json({
          success: false,
          message: 'Collection name already exists',
        });
      }
      
      collection.name = formatName(normalizedName);
      collection.normalizedName = normalizedName;
    }

    if (enabled !== undefined) collection.enabled = enabled;
    if (image !== undefined) collection.image = image;
    if (offerEnabled !== undefined) collection.offerEnabled = offerEnabled;
    if (order !== undefined) collection.order = order;

    await collection.save();

    console.log('✅ Collection updated:', collection.name);

    res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      data: collection,
    });
  } catch (error) {
    console.error('❌ Update Collection Error:', error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Collection name already exists',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update collection',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ========================
// DELETE COLLECTION
// ========================
export const deleteCollection = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    // Prevent deletion of default collections (optional)
    if (collection.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default collections',
      });
    }

    await Collection.findByIdAndDelete(id);

    console.log('✅ Collection deleted:', collection.name);

    res.status(200).json({
      success: true,
      message: 'Collection deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete Collection Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete collection',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ========================
// TOGGLE COLLECTION ENABLED
// ========================
export const toggleCollectionEnabled = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    collection.enabled = !collection.enabled;
    await collection.save();

    console.log(`✅ Collection ${collection.enabled ? 'enabled' : 'disabled'}:`, collection.name);

    res.status(200).json({
      success: true,
      message: `Collection ${collection.enabled ? 'enabled' : 'disabled'} successfully`,
      data: collection,
    });
  } catch (error) {
    console.error('❌ Toggle Collection Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle collection',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ========================
// TOGGLE OFFER ENABLED
// ========================
export const toggleOfferEnabled = async (req, res) => {
  try {
    const { id } = req.params;

    const collection = await Collection.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found',
      });
    }

    collection.offerEnabled = !collection.offerEnabled;
    await collection.save();

    console.log(`✅ Offer ${collection.offerEnabled ? 'enabled' : 'disabled'}:`, collection.name);

    res.status(200).json({
      success: true,
      message: `Offer ${collection.offerEnabled ? 'enabled' : 'disabled'} successfully`,
      data: collection,
    });
  } catch (error) {
    console.error('❌ Toggle Offer Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle offer',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ========================
// BULK UPDATE COLLECTIONS (for saving all changes at once)
// ========================
export const bulkUpdateCollections = async (req, res) => {
  try {
    const { collections } = req.body;

    if (!collections || !Array.isArray(collections)) {
      return res.status(400).json({
        success: false,
        message: 'Collections array is required',
      });
    }

    const updatePromises = collections.map(async (col) => {
      if (!col.id) return null;

      const updateData = {};
      if (col.enabled !== undefined) updateData.enabled = col.enabled;
      if (col.image !== undefined) updateData.image = col.image;
      if (col.offerEnabled !== undefined) updateData.offerEnabled = col.offerEnabled;
      if (col.order !== undefined) updateData.order = col.order;

      return Collection.findByIdAndUpdate(col.id, updateData, { new: true });
    });

    const results = await Promise.all(updatePromises);
    const updatedCollections = results.filter((c) => c !== null);

    console.log('✅ Bulk update completed:', updatedCollections.length, 'collections');

    res.status(200).json({
      success: true,
      message: 'Collections updated successfully',
      data: updatedCollections,
    });
  } catch (error) {
    console.error('❌ Bulk Update Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update collections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ========================
// SEED DEFAULT COLLECTIONS (Run once to initialize)
// ========================
export const seedDefaultCollections = async (req, res) => {
  try {
    const defaultCollections = [
      'Mens',
      'Womens',
      'Kids',
      'Home Textiles',
      'Accessories',
    ];

    const existingCollections = await Collection.find();
    
    if (existingCollections.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Collections already exist. Clear database first if you want to reseed.',
      });
    }

    const collectionsToCreate = defaultCollections.map((name, index) => ({
      name,
      normalizedName: normalizeName(name),
      enabled: true,
      image: '',
      offerEnabled: false,
      isDefault: true,
      order: index,
    }));

    const createdCollections = await Collection.insertMany(collectionsToCreate);

    console.log('✅ Default collections seeded:', createdCollections.length);

    res.status(201).json({
      success: true,
      message: 'Default collections seeded successfully',
      data: createdCollections,
    });
  } catch (error) {
    console.error('❌ Seed Collections Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed collections',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};