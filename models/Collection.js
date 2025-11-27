import mongoose from 'mongoose';

const collectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    normalizedName: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: '',
    },
    offerEnabled: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
collectionSchema.index({ enabled: 1 });
collectionSchema.index({ normalizedName: 1 });

const Collection = mongoose.model('Collection', collectionSchema);

export default Collection;