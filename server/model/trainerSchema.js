import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const trainerRole = process.env.TRAINER_ROLE || 600;

const trainerSchema = new Schema(
  {
    trainerName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
      unique: true,
      match: /^[0-9]{10}$/,
    },
    trainerEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 64,
    },
    experience: {
      type: Number,
      default: 0,
    },
    role: {
      type: Number,
      default: trainerRole,
    },
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "GymUsers", 
      },
    ],
  },
  { timestamps: true }
);

// ✅ Hash password before save
trainerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    return next(error);
  }
});

// ✅ Generate JWT
trainerSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      trainerName: this.trainerName,
      trainerEmail: this.trainerEmail,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// ✅ Check password
trainerSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export const Trainer = mongoose.model("Trainer", trainerSchema);
