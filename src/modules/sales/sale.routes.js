import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import tenant from "../../middlewares/tenant.middleware.js";
import rbac from "../../middlewares/rbac.middleware.js";
import {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  updateSaleStatus,
  updatePayment,
  assignSale,
  deleteSale,
  getSalesStats,
} from "./sale.controller.js";

const router = Router();

router.post(
  "/",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager", "sales", "employee"]),
  createSale
);

router.get(
  "/",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager", "sales", "employee"]),
  getSales
);

router.get(
  "/stats",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager"]),
  getSalesStats
);

router.get(
  "/:id",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager", "sales", "employee"]),
  getSaleById
);

router.put(
  "/:id",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager", "sales", "employee"]),
  updateSale
);

router.patch(
  "/:id/status",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager", "sales", "employee"]),
  updateSaleStatus
);

router.patch(
  "/:id/payment",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager", "sales", "employee"]),
  updatePayment
);

router.patch(
  "/:id/assign",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager","sales", "employee"]),
  assignSale
);

router.delete(
  "/:id",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager","sales", "employee"]),
  deleteSale
);

export default router;
