// controllers/navController.js
import NavItem from '../models/NavRoutes.js';

// Create a new nav item
export const createnavItem = async (req, res) => {
  try {
    const { name, dropdown, children } = req.body;
    const newItem = new NavItem({ name, dropdown, children });
    await newItem.save();
    res.status(201).json({ message: 'Navbar item created', item: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get all nav items
export const getAllnavItem = async (req, res) => {
  try {
    const items = await NavItem.find().sort({ createdAt: 1 });
    res.status(200).json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Update a nav item
export const updatenavItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, dropdown, children } = req.body;
    
    const updatedItem = await NavItem.findByIdAndUpdate(
      id,
      { name, dropdown, children },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ message: 'Nav item not found' });
    }
    
    res.status(200).json({ message: 'Nav item updated', item: updatedItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Delete a nav item
export const deletenavItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedItem = await NavItem.findByIdAndDelete(id);
    
    if (!deletedItem) {
      return res.status(404).json({ message: 'Nav item not found' });
    }
    
    res.status(200).json({ message: 'Nav item deleted', item: deletedItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Clear all nav items
export const clearAllnavItems = async (req, res) => {
  try {
    await NavItem.deleteMany({});
    res.status(200).json({ message: 'All nav items cleared' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error });
  }
};