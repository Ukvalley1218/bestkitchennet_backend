import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import tenant from "../../middlewares/tenant.middleware.js";
import rbac from "../../middlewares/rbac.middleware.js";
import {
  getSalesDashboard,
  getSalesTrends,
  getTopProducts,
  getTopCustomers,
  getSalesPerformance,
  getPendingDeliveries,
} from "./dashboard.controller.js";

const router = Router();

router.get(
  "/",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager"]),
  getSalesDashboard
);

router.get(
  "/trends",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager"]),
  getSalesTrends
);

router.get(
  "/top-products",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager"]),
  getTopProducts
);

router.get(
  "/top-customers",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager"]),
  getTopCustomers
);

router.get(
  "/performance",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager"]),
  getSalesPerformance
);

router.get(
  "/pending-deliveries",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager", "sales"]),
  getPendingDeliveries
);

export default router;
