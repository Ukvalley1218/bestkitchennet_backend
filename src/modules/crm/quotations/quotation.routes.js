import authMiddleware from "../../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../../middlewares/tenant.middleware.js";
import rbac from "../../../middlewares/rbac.middleware.js";
import { createQuotation,getQuotations,updateQuotationStatus } from "./quotation.controller.js";
import { Router } from "express";

const router = Router();
/**
 * Create quotation
 */
router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "admin", "manager", "sales"]),
  createQuotation
);

/**
 * Get quotations
 */
router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "admin", "manager", "sales", "accounts"]),
  getQuotations
);

/**
 * Approve / Reject / Send quotation
 */
router.patch(
  "/:id/status",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "admin", "manager"]),
  updateQuotationStatus
);

export default router;