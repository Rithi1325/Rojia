// controllers/timingBannerController.js
import TimingBanner from "../models/TimingBanner.js";

// CREATE or UPDATE
export const createOrUpdateTimingBanner = async (req, res) => {
  try {
    const data = req.body;

    let banner = await TimingBanner.findOne();

    if (!banner) {
      banner = await TimingBanner.create(data);
    } else {
      await TimingBanner.updateOne({}, data);
      banner = await TimingBanner.findOne();
    }

    res.status(200).json({
      success: true,
      message: "Timing banner saved successfully",
      data: banner,
    });
  } catch (error) {
    console.error("createOrUpdateTimingBanner error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// GET Timing Banner
export const getTimingBanner = async (req, res) => {
  try {
    const banner = await TimingBanner.findOne();

    res.status(200).json({
      success: true,
      data: banner || null,
    });
  } catch (error) {
    console.error("getTimingBanner error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch banner" });
  }
};
