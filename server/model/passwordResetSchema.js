import mongoose from "mongoose";

const { Schema } = mongoose;

const passwordResetSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["Admin", "Trainer", "Receptionist"],
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: "role", // dynamic reference based on role
    },
    otpHash: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: true },
    used: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// TTL index to auto-delete expired docs
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset = mongoose.model("PasswordReset", passwordResetSchema);
