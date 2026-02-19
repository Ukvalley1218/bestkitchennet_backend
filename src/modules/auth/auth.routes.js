import { Router } from "express";
import { login,forgotPassword,verifyOtp,resetPassword } from "./auth.controller.js";

const router = Router();

router.post("/login", login);
router.post("/verify-otp", verifyOtp);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;