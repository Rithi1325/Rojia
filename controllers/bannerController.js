import Banner from "../models/Banner.js";

// GET all banners
export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Banners fetched successfully",
      data: banners
    });

  } catch (error) {
    console.error("getBanners error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch banners"
    });
  }
};


// CREATE banners (multiple base64 images)
export const createBanner = async (req, res) => {
  try {
    const { banners } = req.body;
console.log('banners :',banners)
    if (!banners || !Array.isArray(banners)) {
      return res.status(400).json({ message: "Invalid banner data" });
    }

    const created = await Banner.insertMany(banners);
    res.status(201).json({
  success: true,
  data: created
});

  } catch (error) {
    console.log("createBanner error:", error);
    res.status(500).json({ message: "Failed to upload banners" });
  }
};

// UPDATE banner link
export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { link } = req.body;

    const banner = await Banner.findByIdAndUpdate(
      id,
      { link },
      { new: true }
    );

    res.json(banner);
  } catch (error) {
    res.status(500).json({ message: "Failed to update banner" });
  }
};

// DELETE banner
export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;

    await Banner.findByIdAndDelete(id);

    res.json({ message: "Banner deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete banner" });
  }
};
 