import { Admin } from "../model/adminSchema.js";
import { passwordValidator } from "../utils/passwordValidator.js";
import { emailValidator } from "../utils/emailValidator.js";
import { generateOtp, hashOtp, compareOtp } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { PasswordReset } from "../model/passwordResetSchema.js";
// import jwt from "jsonwebtoken";
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);
const OTP_ATTEMPTS_LIMIT = parseInt(process.env.OTP_ATTEMPTS_LIMIT || "5", 10);

const registerAdmin = async (req, res) => {
  const { phoneNumber, password, userName, adminEmail } = req.body;

  try {
    if (!phoneNumber || !password || !userName || !adminEmail) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!emailValidator(adminEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!passwordValidator(password)) {
      return res.status(400).json({
        message:
          "Password must be 8–64 characters long, include uppercase, lowercase, number, and special character.",
      });
    }
    const existingAdmin = await Admin.findOne({ adminEmail });
    if (existingAdmin) {
      return res.status(409).json({ message: "Email already in use" });
    }
    const admin = await Admin.create({
      phoneNumber,
      password,
      userName,
      adminEmail,
    });
    const createdAdmin = await Admin.findById(admin._id).select("-password");
    if (!createdAdmin) {
      return res.status(500).json({ message: "Admin registration failed" });
    }

    res.status(201).json({
      message: "Admin registered successfully",
      data: createdAdmin,
      
    });
  } catch (error) {
    console.error("Admin Registration Error:", error);
    return res
      .status(500)
      .json({ message: `Internal server error: ${error.message}` });
  }
};
const adminLogin = async (req, res) => {
  const { adminEmail, password } = req.body;

  try {
    if (!adminEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ adminEmail });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isMatch = await admin.isPasswordCorrect(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = admin.generateAccessToken();

    res.status(200).json({
      message: "Login successful",
      token,
      role: admin.role,
      adminId: admin._id,
      adminEmail: admin.adminEmail,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

 const requestPasswordReset = async (req, res) => {
  try {
    const { adminEmail } = req.body;
    if (!adminEmail) return res.status(400).json({ message: "Email is required" });

    const admin = await Admin.findOne({ adminEmail });
    if (!admin) {
      // Don't reveal existence
      return res.status(200).json({
        message: "If an account exists for this email, an OTP has been sent."
      });
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    // Parallel DB ops: check recent requests + invalidate old OTPs
    const [recentRequests] = await Promise.all([
      PasswordReset.countDocuments({
        userId: admin._id,
        role: "Admin",
        createdAt: { $gte: oneMinuteAgo }
      }),
      PasswordReset.updateMany(
        { userId: admin._id, role: "Admin", used: false },
        { used: true }
      )
    ]);

    if (recentRequests >= 5) {
      return res.status(429).json({
        message: "Too many OTP requests. Please try again after a minute."
      });
    }

    // Generate OTP and hash
    const otp = generateOtp(6);
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    console.log(`Generated OTP for ${admin.adminEmail}: ${otp}`);

    // Save OTP record
    await PasswordReset.create({
      userId: admin._id,
      role: "Admin",
      otpHash,
      expiresAt,
    });

    // Send OTP asynchronously
    sendOtpEmail(admin.adminEmail, otp, admin.userName)
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
    const { adminEmail, otp, newPassword } = req.body;

    if (!adminEmail || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and newPassword are required" });
    }

    if (!passwordValidator(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be 8–64 characters long, include uppercase, lowercase, number, and special character."
      });
    }

    const admin = await Admin.findOne({ adminEmail });
    if (!admin) return res.status(400).json({ message: "Invalid OTP or email" });

    const resetDoc = await PasswordReset.findOne({
      userId: admin._id,
      role: "Admin",
      used: false
    }).sort({ createdAt: -1 });

    if (!resetDoc) return res.status(400).json({ message: "Invalid or expired OTP" });

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

    // Compare OTP using fast crypto
    const ok = compareOtp(otp, resetDoc.otpHash);
    if (!ok) {
      resetDoc.attempts += 1;
      await resetDoc.save();
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Update password (pre-save hook will hash it)
    admin.password = newPassword;
    await admin.save();

    // Mark OTP as used
    resetDoc.used = true;
    await resetDoc.save();

    return res.status(200).json({ message: "Password has been reset successfully" });

  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { registerAdmin ,adminLogin,requestPasswordReset,resetPassword};
