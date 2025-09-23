import mongoose, { Schema } from "mongoose";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

dotenv.config();
const adminRole = process.env.ADMIN_ROLE;

const adminSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: Number,
    },
    adminEmail: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlengeth:8,
      maxlength:64
    },
    role: {
      type: String,
      default: adminRole,
    },
  },
  { timestamps: true }
);

// hash password before save
adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    return next(error);
  }
});

// generate JWT token
adminSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      userName: this.userName,
      adminEmail: this.adminEmail,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

// compare password
adminSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export const Admin = mongoose.model("Admin", adminSchema);
