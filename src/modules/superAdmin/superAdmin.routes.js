import { Router } from "express";
import authMiddleware from "../../middlewares/auth.middleware.js";
import { createCompanyWithCEO,getAllCompanies,updateCompanyStatus } from "./superAdmin.controller.js";

const router = Router();


/**
 * Super Admin only routes
 */
router.post("/create-company", authMiddleware, createCompanyWithCEO);
router.get("/companies", authMiddleware, getAllCompanies);
router.patch("/company/:tenantId/status", authMiddleware, updateCompanyStatus);

export default router;