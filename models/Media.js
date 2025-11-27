import mongoose from "mongoose";

const mediaSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["YouTube", "Instagram Reels"],
      required: true,
    },
    url: { type: String, required: true },
    banner: { type: String, required: true }, // base64 image
    isLive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Media = mongoose.model("Media", mediaSchema);

export default Media;
