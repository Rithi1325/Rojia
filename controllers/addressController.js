// controllers/addressController.js
import Address from "../models/Address.js";

// @desc    Get user's saved address
// @route   GET /api/address
// @access  Private
export const getAddress = async (req, res) => {
  try {
    const address = await Address.findOne({ userId: req.user.id });

    if (!address) {
      return res.status(404).json({ message: "No address found" });
    }

    res.status(200).json(address);
  } catch (error) {
    console.error("Error fetching address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Save or Update address
// @route   POST /api/address
// @access  Private
export const saveAddress = async (req, res) => {
  try {
    const { street, village, po, taluk, district, state, pincode, country } =
      req.body;

    // Validation
    if (!street || !village || !district || !state || !pincode || !country) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Check if address already exists
    let address = await Address.findOne({ userId: req.user.id });

    if (address) {
      // Update existing address
      address.street = street;
      address.village = village;
      address.po = po || "";
      address.taluk = taluk || "";
      address.district = district;
      address.state = state;
      address.pincode = pincode;
      address.country = country;

      await address.save();
      return res.status(200).json({ message: "Address updated successfully", address });
    } else {
      // Create new address
      address = new Address({
        userId: req.user.id,
        street,
        village,
        po: po || "",
        taluk: taluk || "",
        district,
        state,
        pincode,
        country,
      });

      await address.save();
      return res.status(201).json({ message: "Address saved successfully", address });
    }
  } catch (error) {
    console.error("Error saving address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete user's address
// @route   DELETE /api/address
// @access  Private
export const deleteAddress = async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ userId: req.user.id });

    if (!address) {
      return res.status(404).json({ message: "No address found to delete" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};