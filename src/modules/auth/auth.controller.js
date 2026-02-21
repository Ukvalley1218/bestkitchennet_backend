import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from '../users/user.model.js';
import OTP from '../auth/auth.model.js';
import { sendOTPEmail } from "../../services/email.service.js";


// helper
const generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * LOGIN → SEND OTP
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("User not found");
    if (user.status !== "active") throw new Error("User inactive");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid credentials");

    const otp = generateOTP();
    console.log("Generated OTP for login:", otp);  // For testing, log the OTP to the console. Remove in production.

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      purpose: "login",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOTPEmail(email, otp, "login");

    res.json({
      success: true,
      message: "OTP sent to email",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * VERIFY OTP → LOGIN SUCCESS
 */
export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const record = await OTP.findOne({ email, otp, purpose: "login" });
    if (!record) throw new Error("Invalid or expired OTP");

    await OTP.deleteMany({ email });

    const user = await User.findOne({ email });

    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
        tenantId: user.tenantId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * FORGOT PASSWORD → SEND OTP
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found");

    const otp = generateOTP();

    await OTP.deleteMany({ email });

    await OTP.create({
      email,
      otp,
      purpose: "reset",
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    await sendOTPEmail(email, otp, "reset");

    res.json({
      success: true,
      message: "OTP sent for password reset",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * RESET PASSWORD
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const record = await OTP.findOne({ email, otp, purpose: "reset" });
    if (!record) throw new Error("Invalid or expired OTP");

    const hashed = await bcrypt.hash(newPassword, 10);

    await User.updateOne({ email }, { password: hashed });
    await OTP.deleteMany({ email });

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (err) {
    next(err);
  }
};