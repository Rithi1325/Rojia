import twilio from "twilio";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let twilioClient = null;

const initializeTwilio = () => {
  try {
    console.log(process.env.TWILIO_ACCOUNT_SID, "🔑 Initializing Twilio client");

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error("❌ Twilio credentials are missing");
      throw new Error("Twilio credentials not configured");
    }

    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID.trim(),
      process.env.TWILIO_AUTH_TOKEN.trim()
    );
    console.log("✅ Twilio client initialized successfully");
    return twilioClient;
  } catch (twilioError) {
    console.error("❌ Twilio initialization failed:", twilioError.message);
    twilioClient = null;
    return null;
  }
};

// Initialize Twilio immediately
initializeTwilio();

const getTwilioClient = () => {
  return twilioClient;
};

export { initializeTwilio, getTwilioClient };