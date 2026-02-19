import authMiddleware from "../../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../../middlewares/tenant.middleware.js";
import rbac from "../../../middlewares/rbac.middleware.js";
import { createActivity,getActivities,completeActivity } from "./activity.controller.js";
import { Router } from "express";

const router = Router();

/**
 * Create follow-up / activity
 */
router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "admin", "manager", "sales"]),
  createActivity
);

/**
 * Get activities
 */
router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "admin", "manager", "sales"]),
  getActivities
);

/**
 * Complete activity
 */
router.patch(
  "/:id/complete",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "admin", "manager", "sales"]),
  completeActivity
);

export default router;