import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const receptionistRole = process.env.RECEPTIONIST_ROLE || "receptionist";

const receptionistSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: Number,
      required: true,
    },
    receptionistEmail: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 64,
    },
    role: {
      type:Number,
      default: receptionistRole,
    },
  },
  { timestamps: true }
);

receptionistSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    return next(error);
  }
});

receptionistSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      userName: this.userName,
      receptionistEmail: this.receptionistEmail,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

receptionistSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export const Receptionist = mongoose.model("Receptionist", receptionistSchema);
