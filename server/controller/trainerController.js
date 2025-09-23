import { Trainer } from "../model/trainerSchema.js";
import { Gym } from "../model/gymSchema.js";
import { GymUsers } from "../model/gymUserSchema.js";
import { passwordValidator } from "../utils/passwordValidator.js";
import { emailValidator } from "../utils/emailValidator.js";
import mongoose from "mongoose";
import { generateOtp, hashOtp, compareOtp } from "../utils/otp.js";
import { sendOtpEmail } from "../utils/mailer.js";
import { PasswordReset } from "../model/passwordResetSchema.js";
import path from "path";
import fs from "fs";
// import jwt from "jsonwebtoken";
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);
const OTP_ATTEMPTS_LIMIT = parseInt(process.env.OTP_ATTEMPTS_LIMIT || "5", 10);

// Register Trainer
const registerTrainer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction(); // start transaction

  try {
    const { phoneNumber, password, trainerName, trainerEmail, experience } = req.body;

    if (!phoneNumber || !password || !trainerName || !trainerEmail) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!emailValidator(trainerEmail)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!passwordValidator(password)) {
      return res.status(400).json({
        message:
          "Password must be 8–64 characters long, include uppercase, lowercase, number, and special character.",
      });
    }

    // Check if trainer exists
    const existingTrainer = await Trainer.findOne({
      $or: [{ trainerEmail }, { phoneNumber }],
    }).session(session);
    if (existingTrainer) {
      return res.status(409).json({ message: "Email or phone number already in use" });
    }

    // Create trainer
    const trainer = await Trainer.create(
      [
        {
          phoneNumber,
          password,
          trainerName,
          trainerEmail,
          experience: experience || 0,
        },
      ],
      { session }
    );

    // Fetch the single gym
    const gym = await Gym.findOne().session(session);
    if (!gym) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No gym found in the system" });
    }

    // Add trainer to gym if not already added
    if (!gym.trainers.includes(trainer[0]._id)) {
      gym.trainers.push(trainer[0]._id);
      await gym.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Return trainer without password
    const createdTrainer = await Trainer.findById(trainer[0]._id).select("-password");

    res.status(201).json({
      message: "Trainer registered successfully and added to the gym",
      data: createdTrainer,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Trainer Registration Error:", error);
    return res.status(500).json({ message: `Internal server error: ${error.message}` });
  }
};

// Login Trainer
const trainerLogin = async (req, res) => {
  const { trainerEmail, password } = req.body;

  try {
    if (!trainerEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const trainer = await Trainer.findOne({ trainerEmail });
    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }

    const isMatch = await trainer.isPasswordCorrect(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = trainer.generateAccessToken();

    res.status(200).json({
      message: "Login successful",
      token,
      role: trainer.role,
      trainerId: trainer._id,
      trainerEmail: trainer.trainerEmail,
    });
  } catch (error) {
    console.error("Trainer Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// Get all trainers with assigned users count
const getAllTrainers = async (req, res) => {
  try {

    const trainers = await Trainer.find()
      .populate("users", "firstName lastName phoneNumber") 
      .lean();
    const trainersWithCounts = trainers.map((trainer) => ({
      ...trainer,
      assignedUserCount: trainer.users ? trainer.users.length : 0,
    }));

    res.status(200).json({
      message: "Trainers fetched successfully",
      count: trainersWithCounts.length,
      trainers: trainersWithCounts,
    });
  } catch (error) {
    console.error("Error fetching trainers:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
 const deleteTrainer = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Trainer ID" });
  }

  try {

    const trainer = await Trainer.findById(id);
    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }
    await GymUsers.updateMany(
      { trainer: id },
      { $pull: { trainer: id } } 
    );
    await Trainer.findByIdAndDelete(id);

    res.status(200).json({ message: "Trainer deleted successfully and users released" });
  } catch (error) {
    console.error("Error deleting trainer:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};
const getUsersByTrainer = async (req, res) => {
  const { id: trainerId } = req.params;
  const { page = 1, limit = 10, search = "", userType, status } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    // --- Build base filter ---
    const filter = { trainer: trainerId };

    // --- Search filter ---
    if (search) {
      const searchRegex = new RegExp(search, "i");

      // search by name always
      filter.$or = [{ name: searchRegex }];

      // if search is numeric → check phone & WhatsApp too
      if (!isNaN(search)) {
        filter.$or.push({ phoneNumber: Number(search) });
        filter.$or.push({ whatsAppNumber: Number(search) });
      }
    }

    // --- Filter by userType ---
    if (userType && ["athlete", "non-athlete"].includes(userType)) {
      filter.userType = userType;
    }

    // --- Filter by subscription status ---
    if (status && ["active", "expired"].includes(status)) {
      filter["subscription.status"] = status;
    }

    // --- Fetch filtered & paginated users ---
    const [users, totalCount] = await Promise.all([
      GymUsers.find(filter)
        .select("name address phoneNumber whatsAppNumber dietPdf subscription userType")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      GymUsers.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      page: pageNum,
      totalPages,
      totalCount,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users for trainer:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
const assignDietPlan = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const dietFile = req.files?.dietPdf?.[0];
    if (!dietFile) {
      return res.status(400).json({ message: "Diet PDF is required" });
    }

    // ✅ Update directly without fetching first
    const gymUser = await GymUsers.findOneAndUpdate(
      { _id: userId, $expr: { $lt: [{ $size: "$dietPdfs" }, 10] } }, // check max 10
      { $push: { dietPdfs: `uploads/diets/${dietFile.filename}` } },
      { new: true }
    );

    if (!gymUser) {
      return res.status(400).json({ message: "User not found or max 10 diet plans reached" });
    }

    res.json({
      message: "Diet plan assigned successfully",
      user: {
        id: gymUser._id,
        name: gymUser.name,
        dietPdfs: gymUser.dietPdfs,
      },
    });
  } catch (error) {
    console.error("Error assigning diet plan:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteDietPlan = async (req, res) => {
  try {
    const { userId, index } = req.body;

    if (userId == null || index == null) {
      return res.status(400).json({ message: "User ID and index are required" });
    }

    // ✅ Find user
    const gymUser = await GymUsers.findById(userId);
    if (!gymUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Check if index is valid
    if (index < 0 || index >= gymUser.dietPdfs.length) {
      return res.status(404).json({ message: "Invalid diet plan index" });
    }

    // ✅ Get file path to delete
    const filePath = gymUser.dietPdfs[index];

    // ✅ Remove from array
    gymUser.dietPdfs.splice(index, 1);
    await gymUser.save();

    // ✅ Delete physical file
    const absolutePath = path.join(process.cwd(), filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    res.json({
      message: "Diet plan deleted successfully",
      user: {
        id: gymUser._id,
        name: gymUser.name,
        dietPdfs: gymUser.dietPdfs,
      },
    });
  } catch (error) {
    console.error("Error deleting diet plan:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { trainerEmail } = req.body;
    if (!trainerEmail)
      return res.status(400).json({ message: "Email is required" });

    const trainer = await Trainer.findOne({ trainerEmail });
    if (!trainer) {
      // Don't reveal existence
      return res.status(200).json({
        message: "If an account exists for this email, an OTP has been sent."
      });
    }

    // --- Check request limit and mark old OTPs as used in parallel ---
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const [recentRequests] = await Promise.all([
      PasswordReset.countDocuments({
        userId: trainer._id,
        role: "Trainer",
        createdAt: { $gte: oneMinuteAgo }
      }),
      PasswordReset.updateMany(
        { userId: trainer._id, role: "Trainer", used: false },
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

    console.log(`Generated OTP for ${trainer.trainerEmail}: ${otp}`);

    await PasswordReset.create({
      userId: trainer._id,
      role: "Trainer",
      otpHash,
      expiresAt,
    });

    // --- Send email async, don't block response ---
    sendOtpEmail(trainer.trainerEmail, otp, trainer.userName)
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
    const { trainerEmail, otp, newPassword } = req.body;

    if (!trainerEmail || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and newPassword are required" });
    }

    if (!passwordValidator(newPassword)) {
      return res.status(400).json({
        message:
          "Password must be 8–64 characters long, include uppercase, lowercase, number, and special character."
      });
    }

    const trainer = await Trainer.findOne({ trainerEmail });
    if (!trainer) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    const resetDoc = await PasswordReset.findOne({
      userId: trainer._id,
      role: "Trainer",
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
    trainer.password = newPassword;
    await trainer.save();

    // ✅ Mark OTP as used
    resetDoc.used = true;
    await resetDoc.save();

    return res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error("resetPassword error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { registerTrainer, trainerLogin,getAllTrainers ,deleteTrainer,getUsersByTrainer,assignDietPlan,requestPasswordReset,resetPassword,deleteDietPlan};
