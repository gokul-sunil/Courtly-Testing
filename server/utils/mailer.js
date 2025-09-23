import nodemailer from "nodemailer";
import { mailConfig } from "./config.js";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: mailConfig.user,
    pass: mailConfig.pass,
  },
});


export async function sendOtpEmail(to, otp, name = "") {
  const subject = "Your password reset OTP";
  const text = `Your OTP for password reset is: ${otp}. It will expire in ${mailConfig.otpExpiryMinutes} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height:1.4;">
      <h3>Password Reset OTP</h3>
      <p>Hi ${name || "there"},</p>
      <p>Your password reset OTP is:</p>
      <p style="font-size: 22px; font-weight: 600; letter-spacing: 2px;">${otp}</p>
      <p>This code expires in ${mailConfig.otpExpiryMinutes} minutes.</p>
      <p>If you didn't request this, ignore this mail.</p>
    </div>
  `;

  return transporter.sendMail({
    from: mailConfig.fromEmail,
    to,
    subject,
    text,
    html,
  });
}
