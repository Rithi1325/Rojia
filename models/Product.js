// models/Product.js
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
{
// Basic Product Info
id: {
type: String,
required: true,
unique: true,
},
collection: {
type: String,
required: true,
},
title: {
type: String,
required: true,
},
description: {
type: String,
default: "",
},

// Pricing
price: {
type: Number,
required: true,
},
sellingPrice: {
type: Number,
required: true,
},
discount: {
type: Number,
default: 0,
},

// Stock Management
stock: {
type: String,
enum: ["In Stock", "Out of Stock", "Low Stock"],
default: "In Stock",
},

// Stock Details - Complex nested structure for size/color/quantity
stockDetails: {
type: Map,
of: {
type: Map,
of: {
quantity: Number,
codename: String,
images: [String],
},
},
default: {},
},

// Product Attributes
colors: {
type: String,
default: "",
},
size: {
type: String,
default: "",
},
age: {
type: String,
default: "",
},

// Images - Color-wise images
colorImages: {
type: Map,
of: [String],
default: {},
},

// Saree Specific Fields
sareeType: {
type: String,
default: "",
},
sleeveType: {
type: String,
default: "",
},

// Instruction Reference
instructionId: {
type: String,
default: "",
},

// Admin Management
isActive: {
type: Boolean,
default: true,
},
createdBy: {
type: String,
default: "admin",
},
},
{
timestamps: true, // Adds createdAt and updatedAt automatically
}
);

// Index for faster queries
productSchema.index({ collection: 1 });
productSchema.index({ stock: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ id: 1 });

const Product = mongoose.model("Product", productSchema);

export default Product;