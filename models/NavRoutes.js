// models/NavItem.js
import mongoose from 'mongoose';

const navItemSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  dropdown: { 
    type: Boolean, 
    default: false 
  },
  children: [
    {
      name: { 
        type: String, 
        required: true,
        trim: true
      },
      url: {  // Optional: add URL field for children
        type: String,
        default: '#'
      }
    },
  ],
  url: {  // Optional: add URL field for main items
    type: String,
    default: '#'
  },
  order: {  // For custom ordering
    type: Number,
    default: 0
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
navItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const NavItem = mongoose.model('NavItem', navItemSchema);
export default NavItem;