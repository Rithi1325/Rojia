// models/TimingBanner.js
import mongoose from "mongoose";

const timingBannerSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    title: { type: String, default: "" },
    start: { type: String, default: "" },
    end: { type: String, default: "" },
    image: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("TimingBanner", timingBannerSchema);