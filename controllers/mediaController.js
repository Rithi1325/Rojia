import Media from "../models/Media.js";

// CREATE MEDIA
export const createMedia = async (req, res) => {
  try {
    // Log the incoming request body to check its content
    console.log('Request Body:', req.body);

    // Destructure 'type', 'url', 'isLive', and 'banner' from req.body
    const { type, url, isLive, banner } = req.body;

    // Validation for required fields
    if (!type || !url) {
      return res.status(400).json({ success: false, message: "Missing required fields: type and url" });
    }

    // Optionally, validate 'isLive' (if it's required to be a boolean)
    if (isLive !== undefined && typeof isLive !== 'boolean') {
      return res.status(400).json({ success: false, message: "'isLive' must be a boolean" });
    }

    console.log('Received type:', type);
    console.log('Received URL:', url);
    console.log('Received isLive:', isLive);
    console.log('Received banner:', banner);

    // If 'banner' is present, you may want to validate it as well
    if (banner && typeof banner !== 'string') {
      return res.status(400).json({ success: false, message: "'banner' should be a string" });
    }

    // Create a new media entry in the database
    const newMedia = await Media.create({ type, url, isLive, banner });

    // Send success response
    res.status(200).json({
      success: true,
      message: "Media created successfully",
      data: newMedia,
    });
  } catch (error) {
    console.error("createMedia error:", error);
    res.status(500).json({ success: false, message: "Failed to create media" });
  }
};

// GET ALL MEDIA
export const getMedia = async (req, res) => {
  try {
    const mediaList = await Media.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Media fetched successfully",
      data: mediaList,
    });
  } catch (error) {
    console.error("getMedia error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch media" });
  }
};

// UPDATE MEDIA
export const updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Media.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    res.json({
      success: true,
      message: "Media updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("updateMedia error:", error);
    res.status(500).json({ success: false, message: "Failed to update media" });
  }
};

// DELETE MEDIA
export const deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Media.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Media not found" });
    }

    res.json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error) {
    console.error("deleteMedia error:", error);
    res.status(500).json({ success: false, message: "Failed to delete media" });
  }
};
