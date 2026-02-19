import auth from "../../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../../middlewares/tenant.middleware.js";
import rbac from "../../../middlewares/rbac.middleware.js";
import { createCustomer,convertLeadToCustomer,getCustomers } from "./customer.controller.js";
import { Router } from "express";

const router = Router();

/**
 * Manual customer creation
 */
router.post(
  "/",
  auth,
  tenantMiddleware,
  rbac(["super_admin", "admin", "manager"]),
  createCustomer
);

/**
 * Convert lead → customer
 */
router.post(
  "/convert/:leadId",
  auth,
  tenantMiddleware,
  rbac(["super_admin", "admin", "manager", "sales"]),
  convertLeadToCustomer
);

/**
 * List customers
 */
router.get(
  "/",
  auth,
  tenantMiddleware,
  rbac(["super_admin", "admin", "manager", "sales", "accounts"]),
  getCustomers
);

export default router;