// controllers/cartController.js
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

// 🔹 1. GET USER CART
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🔍 Fetching cart for user:", userId);

    let cart = await Cart.findOne({ userId });

    // If cart doesn't exist, create empty cart
    if (!cart) {
      // For guest users, handle specially to avoid duplicate key errors
      if (userId === "guest") {
        try {
          // First try to create a new cart for guest
          cart = new Cart({ userId: "guest", items: [] });
          await cart.save();
          console.log("✅ Created new empty cart for guest user");
        } catch (err) {
          // If there's a duplicate key error, try to find existing cart
          if (err.code === 11000) {
            console.log("Guest cart already exists, retrieving it");
            cart = await Cart.findOne({ userId: "guest" });
            
            // If still not found, try with null userId (for backward compatibility)
            if (!cart) {
              cart = await Cart.findOne({ userId: null });
              if (cart) {
                // Update the existing cart with null userId to use "guest"
                cart.userId = "guest";
                await cart.save();
                console.log("✅ Updated existing null user cart to guest");
              }
            }
          } else {
            throw err; // Re-throw if it's not a duplicate key error
          }
        }
      } else {
        // For regular users, create a new cart
        cart = new Cart({ userId, items: [] });
        await cart.save();
        console.log("✅ Created new empty cart for user:", userId);
      }
    }

    console.log(`✅ Cart found with ${cart.items.length} items`);

    res.status(200).json({ cart });
  } catch (error) {
    console.error("Error fetching cart:", error);
    
    // If we get a duplicate key error, try to find the existing cart
    if (error.code === 11000) {
      console.log("Duplicate key error, trying to find existing cart");
      try {
        const cart = await Cart.findOne({ userId });
        if (cart) {
          return res.status(200).json({ cart });
        }
      } catch (findError) {
        console.error("Error finding existing cart:", findError);
      }
    }
    
    res.status(500).json({ 
      message: "Failed to fetch cart", 
      error: error.message 
    });
  }
};

// 🔹 2. ADD ITEM TO CART
export const addToCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, selectedSize, selectedColor, quantity } = req.body;

    console.log("➕ Adding to cart:", { userId, productId, selectedSize, selectedColor, quantity });

    // Validate input
    if (!productId || !selectedSize || !selectedColor || !quantity) {
      return res.status(400).json({ 
        message: "Missing required fields: productId, selectedSize, selectedColor, quantity" 
      });
    }

    // Fetch product details from database
    const product = await Product.findOne({ id: productId });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check stock availability
    const stockData = product.stockDetails?.get(selectedSize)?.get(selectedColor);
    
    if (!stockData || parseInt(stockData.quantity) < quantity) {
      return res.status(400).json({ 
        message: "Insufficient stock",
        availableStock: stockData ? parseInt(stockData.quantity) : 0
      });
    }

    // Get or create cart with better error handling
    let cart;
    try {
      cart = await Cart.findOne({ userId });
      
      if (!cart) {
        cart = new Cart({ userId, items: [] });
        await cart.save();
        console.log("✅ Created new empty cart for user:", userId);
      }
    } catch (cartError) {
      if (cartError.code === 11000) {
        // Handle duplicate key error
        cart = await Cart.findOne({ userId });
        if (!cart) {
          return res.status(500).json({ 
            message: "Failed to create or find cart", 
            error: cartError.message 
          });
        }
      } else {
        throw cartError;
      }
    }

    // Check if item already exists in cart (same product, size, color)
    const existingItemIndex = cart.items.findIndex(
      item => 
        item.productId === productId && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
    );

    // Get first image for the selected color
    const images = stockData.images || [];
    const itemImage = images[0] || product.colorImages?.get(selectedColor)?.[0] || "";

    const cartItem = {
      productId,
      title: product.title,
      image: itemImage,
      price: product.sellingPrice || product.price,
      originalPrice: product.price,
      discount: product.discount || 0,
      selectedSize,
      selectedColor,
      quantity,
      collection: product.collection,
    };

    if (existingItemIndex > -1) {
      // Update quantity if item exists
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Check if new quantity exceeds stock
      if (newQuantity > parseInt(stockData.quantity)) {
        return res.status(400).json({ 
          message: "Cannot add more items. Stock limit reached",
          availableStock: parseInt(stockData.quantity),
          currentCartQuantity: cart.items[existingItemIndex].quantity
        });
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
      console.log("🔄 Updated existing item quantity to:", newQuantity);
    } else {
      // Add new item
      cart.items.push(cartItem);
      console.log("✅ Added new item to cart");
    }

    await cart.save();

    console.log(`✅ Cart updated: ${cart.totalItems} items, Total: ₹${cart.totalPrice}`);

    res.status(200).json({ 
      message: "Item added to cart successfully",
      cart 
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ 
      message: "Failed to add item to cart", 
      error: error.message 
    });
  }
};

// 🔹 3. UPDATE CART ITEM QUANTITY
export const updateCartItem = async (req, res) => {
  try {
    const { userId, itemIndex } = req.params;
    const { quantity } = req.body;

    console.log("🔄 Updating cart item:", { userId, itemIndex, quantity });

    if (quantity < 1) {
      return res.status(400).json({ message: "Quantity must be at least 1" });
    }

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const index = parseInt(itemIndex);
    
    if (index < 0 || index >= cart.items.length) {
      return res.status(400).json({ message: "Invalid item index" });
    }

    const item = cart.items[index];

    // Check stock availability
    const product = await Product.findOne({ id: item.productId });
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const stockData = product.stockDetails?.get(item.selectedSize)?.get(item.selectedColor);
    
    if (!stockData || parseInt(stockData.quantity) < quantity) {
      return res.status(400).json({ 
        message: "Insufficient stock",
        availableStock: stockData ? parseInt(stockData.quantity) : 0
      });
    }

    cart.items[index].quantity = quantity;
    await cart.save();

    console.log(`✅ Updated item quantity: ${cart.totalItems} items, Total: ₹${cart.totalPrice}`);

    res.status(200).json({ 
      message: "Cart item updated successfully",
      cart 
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({ 
      message: "Failed to update cart item", 
      error: error.message 
    });
  }
};

// 🔹 4. REMOVE ITEM FROM CART
export const removeFromCart = async (req, res) => {
  try {
    const { userId, itemIndex } = req.params;

    console.log("🗑️ Removing item from cart:", { userId, itemIndex });

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const index = parseInt(itemIndex);
    
    if (index < 0 || index >= cart.items.length) {
      return res.status(400).json({ message: "Invalid item index" });
    }

    cart.items.splice(index, 1);
    await cart.save();

    console.log(`✅ Item removed: ${cart.totalItems} items remaining`);

    res.status(200).json({ 
      message: "Item removed from cart successfully",
      cart 
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ 
      message: "Failed to remove item from cart", 
      error: error.message 
    });
  }
};

// 🔹 5. CLEAR ENTIRE CART
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log("🧹 Clearing cart for user:", userId);

    const cart = await Cart.findOne({ userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    console.log("✅ Cart cleared successfully");

    res.status(200).json({ 
      message: "Cart cleared successfully",
      cart 
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ 
      message: "Failed to clear cart", 
      error: error.message 
    });
  }
};

// 🔹 6. GET CART ITEM COUNT
export const getCartCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({ userId });

    const count = cart ? cart.totalItems : 0;

    res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting cart count:", error);
    res.status(500).json({ 
      message: "Failed to get cart count", 
      error: error.message 
    });
  }
};