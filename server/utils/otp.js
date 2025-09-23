// otp.js
import crypto from "crypto";

// 🔹 Generate numeric OTP (default: 6 digits)
export function generateOtp(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

// 🔹 Hash OTP using SHA-256 (fast & secure for short-lived tokens)
export function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

// 🔹 Compare plain OTP with hashed OTP
export function compareOtp(plainOtp, otpHash) {
  const hashed = crypto.createHash("sha256").update(plainOtp).digest("hex");
  return hashed === otpHash;
}
