import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config(); // <-- make sure this is here at top

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT), // make sure it's number
  secure: false, // 587 always false
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false, // prevent self-signed cert issue
  },
});

export const sendOTPEmail = async (to, otp, purpose) => {
  const subject =
    purpose === "login"
      ? "Login OTP Verification"
      : "Reset Password OTP";

  const html = `
    <h3>${subject}</h3>
    <p>Your OTP is:</p>
    <h2>${otp}</h2>
    <p>This OTP is valid for 5 minutes.</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Best Kitchenettes" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log("📩 Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    throw error;
  }
};
