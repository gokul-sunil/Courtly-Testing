import { Receptionist } from "../model/receptionistSchema.js"
import { passwordValidator } from "../utils/passwordValidator.js";
import { emailValidator } from "../utils/emailValidator.js";
import mongoose from "mongoose";
import { PasswordReset } from "../model/passwordResetSchema.js";
import { generateOtp, hashOtp, compareOtp } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/mailer.js";
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);
const OTP_ATTEMPTS_LIMIT = parseInt(process.env.OTP_ATTEMPTS_LIMIT || "5", 10);

// Register
const registerReceptionist = async (req, res) => {
  const { phoneNumber, password, userName, receptionistEmail } = req.body;

  try {
    if (!phoneNumber || !password || !userName || !receptionistEmail) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!emailValidator(receptionistEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!passwordValidator(password)) {
      return res.status(400).json({
        message:
          "Password must be 8–64 characters long, include uppercase, lowercase, number, and special character.",
      });
    }

    const existingReceptionist = await Receptionist.findOne({ receptionistEmail });
    if (existingReceptionist) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const receptionist = await Receptionist.create({
      phoneNumber,
      password,
      userName,
      receptionistEmail,
    });

    const createdReceptionist = await Receptionist.findById(receptionist._id).select("-password");
    if (!createdReceptionist) {
      return res.status(500).json({ message: "Receptionist registration failed" });
    }

    res.status(201).json({
      message: "Receptionist registered successfully",
      data: createdReceptionist,
    });
  } catch (error) {
    console.error("Receptionist Registration Error:", error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};

// Login
const receptionistLogin = async (req, res) => {
  const { receptionistEmail, password } = req.body;

  try {
    if (!receptionistEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const receptionist = await Receptionist.findOne({ receptionistEmail });
    if (!receptionist) {
      return res.status(404).json({ message: "Receptionist not found" });
    }

    const isMatch = await receptionist.isPasswordCorrect(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = receptionist.generateAccessToken();

    res.status(200).json({
      message: "Login successful",
      token,
      role: receptionist.role,
      receptionistId: receptionist._id,
      receptionistEmail: receptionist.receptionistEmail,
    });
  } catch (error) {
    console.error("Receptionist Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
 const getAllReceptionists = async (req, res) => {
  try {
    const receptionists = await Receptionist.find().select('-password'); 
    if (!receptionists || receptionists.length === 0) {
      return res.status(404).json({ message: "No receptionists found" });
    }
    res.status(200).json({ message: "Receptionists fetched successfully",count:receptionists.length, receptionists });
  } catch (error) {
    console.error("Error fetching receptionists:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message});
  }
};
const deleteReceptionist = async (req, res) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Receptionist ID" });
  }

  try {
    const receptionist = await Receptionist.findById(id);
    if (!receptionist) {
      return res.status(404).json({ message: "Receptionist not found" });
    }
    await Receptionist.findByIdAndDelete(id);

    res.status(200).json({ message: "Receptionist deleted successfully" });
  } catch (error) {
    console.error("Error deleting receptionist:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
const requestPasswordReset = async (req, res) => {
  try {
    const { receptionistEmail } = req.body;
    if (!receptionistEmail)
      return res.status(400).json({ message: "Email is required" });

    const receptionist = await Receptionist.findOne({ receptionistEmail });
    if (!receptionist) {
      // Don't reveal existence
      return res.status(200).json({
        message: "If an account exists for this email, an OTP has been sent."
      });
    }

    // --- Check request limit and mark old OTPs as used in parallel ---
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const [recentRequests] = await Promise.all([
      PasswordReset.countDocuments({
        userId: receptionist._id,
        role: "Receptionist",
        createdAt: { $gte: oneMinuteAgo }
      }),
      PasswordReset.updateMany(
        { userId: receptionist._id, role: "Receptionist", used: false },
        { used: true }
      )
    ]);

    if (recentRequests >= 5) {
      return res.status(429).json({
        message: "Too many OTP requests. Please try again after a minute."
      });
    }

    // --- Generate OTP ---
    const otp = generateOtp(6);
    const otpHash = hashOtp(otp); // crypto hash is synchronous & fast
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    console.log(`Generated OTP for ${receptionist.receptionistEmail}: ${otp}`);

    await PasswordReset.create({
      userId: receptionist._id,
      role: "Receptionist",
      otpHash,
      expiresAt,
    });

    // --- Send email async, don't block response ---
    sendOtpEmail(receptionist.receptionistEmail, otp, receptionist.userName)
      .catch(err => console.error("Failed to send OTP email:", err));

    return res.status(200).json({
      message: "If an account exists for this email, an OTP has been sent."
    });
  } catch (error) {
    console.error("requestPasswordReset error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
 const resetPassword = async (req, res) => {
  try {
    const { receptionistEmail, otp, newPassword } = req.body;

    if (!receptionistEmail || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and newPassword are required" });
    }

    if (!passwordValidator(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be 8–64 characters long, include uppercase, lowercase, number, and special character."
      });
    }

    const receptionist = await Receptionist.findOne({ receptionistEmail });
    if (!receptionist) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    const resetDoc = await PasswordReset.findOne({
      userId: receptionist._id,
      role: "Receptionist",
      used: false
    }).sort({ createdAt: -1 });

    if (!resetDoc) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    if (resetDoc.expiresAt < new Date()) {
      resetDoc.used = true;
      await resetDoc.save();
      return res.status(400).json({ message: "OTP expired" });
    }

    if (resetDoc.attempts >= OTP_ATTEMPTS_LIMIT) {
      resetDoc.used = true;
      await resetDoc.save();
      return res.status(429).json({ message: "Too many attempts. Request a new OTP." });
    }

    // ✅ Compare OTP
    const ok = compareOtp(otp, resetDoc.otpHash);
    if (!ok) {
      resetDoc.attempts += 1;
      await resetDoc.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // ✅ Update password (auto-hashed via pre-save middleware)
    receptionist.password = newPassword;
    await receptionist.save();

    // ✅ Mark OTP as used
    resetDoc.used = true;
    await resetDoc.save();

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




export { registerReceptionist, receptionistLogin,getAllReceptionists ,deleteReceptionist,requestPasswordReset,resetPassword};
