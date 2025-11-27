import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getTwilioClient } from "../config/authConfig.js";

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Format phone number for Twilio
const formatPhoneForTwilio = (phone) => {
  // Remove any spaces or special characters
  const cleaned = phone.replace(/\D/g, "");

  // If it's 10 digits, assume Indian number and add +91
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }

  // If it starts with 91 and is 12 digits, add +
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return `+${cleaned}`;
  }

  // If it already has country code, ensure it starts with +
  if (cleaned.length > 10 && !cleaned.startsWith("+")) {
    return `+${cleaned}`;
  }

  return cleaned;
};

// Validate phone number
const isValidPhone = (phone) => {
  return /^[6-9]\d{9}$/.test(phone.replace(/\D/g, ""));
};

// Send OTP via Twilio
const sendOTPViaTwilio = async (phone, otp, purpose = "login") => {
  const twilioClient = getTwilioClient(); // Get the initialized client
  
  // If Twilio client is not initialized, throw error
  if (!twilioClient) {
    throw new Error("Twilio service not configured");
  }

  try {
    const formattedPhone = formatPhoneForTwilio(phone);

    console.log(`📱 Attempting to send OTP to: ${formattedPhone}`);
    console.log(`🔑 Using Twilio phone: ${process.env.TWILIO_PHONE_NUMBER}`);

    const message = await twilioClient.messages.create({
      body: `Your OTP for ${purpose} is: ${otp}. Valid for 5 minutes. - Prabha Tex`,
      from: process.env.TWILIO_PHONE_NUMBER.trim(),
      to: formattedPhone,
    });

    console.log(`✅ OTP sent via Twilio to ${formattedPhone}`);
    console.log(`📱 Message SID: ${message.sid}`);
    console.log(`📱 Message Status: ${message.status}`);

    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error("❌ Twilio Error Details:");
    console.error("Error Code:", error.code);
    console.error("Error Message:", error.message);
    console.error("Error More Info:", error.error);

    // Specific error handling for Twilio
    if (error.code === 21211) {
      throw new Error("Invalid phone number format");
    } else if (error.code === 21608) {
      throw new Error("Twilio account not authorized to send to this number");
    } else if (error.code === 21408) {
      throw new Error(
        "Twilio phone number not verified for testing. Please verify in Twilio console."
      );
    } else if (error.code === 20003) {
      throw new Error(
        "Twilio authentication failed. Check Account SID and Auth Token."
      );
    }

    throw new Error(`Failed to send OTP: ${error.message}`);
  }
};

// ========================
// SIGNUP WITH OTP
// ========================

export const sendSignupOTP = async (req, res) => {
  try {
    const { phone, name, password } = req.body;

    console.log("=== SIGNUP OTP REQUEST ===");
    console.log("Phone:", phone);
    console.log("Name:", name);

    // Validation
    if (!phone || !name || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone, name, and password are required",
      });
    }

    // Validate phone format
    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit Indian phone number",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ phone });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create temporary user with OTP (not verified yet)
    const tempUser = new User({
      phone: phone.replace(/\D/g, ""),
      name: name.trim(),
      password,
      otp,
      otpExpiry,
      isPhoneVerified: false, // Will be set to true after OTP verification
    });

    await tempUser.save();
    console.log("📱 Generated Signup OTP:", otp);

    try {
      // Send OTP via Twilio
      await sendOTPViaTwilio(phone, otp, "signup");

      res.status(200).json({
        success: true,
        message: "OTP sent successfully to your phone",
      });
    } catch (twilioError) {
      console.log("⚠️ Twilio SMS failed, returning OTP for development");

      // For development/testing: return OTP in response
      res.status(200).json({
        success: true,
        message: `OTP generated: ${otp} (SMS failed - ${twilioError.message})`,
        otp: otp, // Include OTP for development
        debug: process.env.NODE_ENV === 'development' ? twilioError.message : undefined,
      });
    }
  } catch (error) {
    console.error("❌ Send Signup OTP Error:", error);

    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const verifySignupOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    console.log("=== VERIFY SIGNUP OTP ===");
    console.log("Phone:", phone);
    console.log("OTP:", otp);

    // Validation
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit Indian phone number",
      });
    }

    // Find temporary user with OTP fields
    const user = await User.findOne({ 
      phone: phone.replace(/\D/g, ""),
      isPhoneVerified: false 
    }).select("+otp +otpExpiry +name");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No signup request found or OTP expired. Please start signup again.",
      });
    }

    // Verify OTP exists and is valid
    if (!user.otp || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "No OTP requested or OTP expired",
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check OTP expiry
    if (new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    // Mark user as verified and clear OTP
    user.isPhoneVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    console.log("✅ Signup successful with OTP verification");

    res.status(201).json({
      success: true,
      message: "Signup successful",
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified,
        token,
      },
    });
  } catch (error) {
    console.error("❌ Verify Signup OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ========================
// LOGIN (Direct without OTP)
// ========================

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Phone:", phone);

    // Validation
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password are required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit Indian phone number",
      });
    }

    // Find user with password
    const user = await User.findOne({ 
      phone: phone.replace(/\D/g, ""),
      isPhoneVerified: true 
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password, or phone not verified",
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    console.log("✅ Login successful");

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        isPhoneVerified: user.isPhoneVerified,
        token,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to login. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Remove the old completeSignup function and replace with OTP-based signup above

// ========================
// PASSWORD RESET
// ========================

export const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    console.log("=== FORGOT PASSWORD ===");
    console.log("Phone:", phone);

    // Validation
    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit Indian phone number",
      });
    }

    // Find user
    const user = await User.findOne({ phone });
    if (!user) {
      // Don't reveal that phone doesn't exist for security
      return res.status(200).json({
        success: true,
        message: "If the phone number is registered, OTP will be sent",
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

    // Save OTP to user
    await User.findOneAndUpdate(
      { _id: user._id },
      {
        otp,
        otpExpiry,
      }
    );

    console.log("📱 Generated Reset OTP:", otp);

    try {
      // Send OTP via Twilio
      await sendOTPViaTwilio(phone, otp, "password reset");

      res.status(200).json({
        success: true,
        message: "OTP sent successfully to your phone",
      });
    } catch (twilioError) {
      console.log("⚠️ Twilio SMS failed, returning OTP for testing");

      res.status(200).json({
        success: true,
        message: `OTP generated: ${otp} (SMS failed - ${twilioError.message})`,
        ...(process.env.NODE_ENV === "development" && { otp }),
      });
    }
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const verifyResetOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    console.log("=== VERIFY RESET OTP ===");
    console.log("Phone:", phone);
    console.log("OTP:", otp);

    // Validation
    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone and OTP are required",
      });
    }

    // Find user with OTP fields
    const user = await User.findOne({ phone }).select("+otp +otpExpiry");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check OTP expiry
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP verified successfully. You can now reset your password.",
    });
  } catch (error) {
    console.error("❌ Verify Reset OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    console.log("=== RESET PASSWORD ===");
    console.log("Phone:", phone);

    // Validation
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Find user with OTP fields
    const user = await User.findOne({ phone }).select(
      "+otp +otpExpiry +password"
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify OTP
    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Check OTP expiry
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please request a new OTP.",
      });
    }

    // Update password
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    console.log("✅ Password reset successful");

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. You can now login with new password.",
    });
  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ========================
// PROFILE MANAGEMENT
// ========================

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -otp -otpExpiry"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("❌ Get Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) {
      if (!isValidPhone(phone)) {
        return res.status(400).json({
          success: false,
          message: "Please provide a valid 10-digit Indian phone number",
        });
      }
      updateData.phone = phone.replace(/\D/g, "");
    }

    // Check if phone is being updated and if it's already taken
    if (updateData.phone) {
      const existingUser = await User.findOne({
        phone: updateData.phone,
        _id: { $ne: userId },
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Phone number already in use",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -otp -otpExpiry");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("❌ Update Profile Error:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Phone number already in use",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // Find user with password
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("❌ Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const checkPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid 10-digit Indian phone number",
      });
    }

    const userExists = await User.findOne({ phone: phone.replace(/\D/g, "") });

    res.status(200).json({
      success: true,
      data: {
        available: !userExists,
      },
    });
  } catch (error) {
    console.error("❌ Check Phone Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check phone availability",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
