import authMiddleware from "../../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../../middlewares/tenant.middleware.js";
import rbac from "../../../middlewares/rbac.middleware.js";
import { createInvoice,getInvoices,addPayment } from "./invoice.controller.js";
import { Router } from "express";

const router = Router();

router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "admin", "accounts"]),
  createInvoice
);

router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "admin", "accounts", "manager"]),
  getInvoices
);

router.post(
  "/:id/payments",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "admin", "accounts"]),
  addPayment
);

export default router;