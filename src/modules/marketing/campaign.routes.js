import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import tenant from "../../middlewares/tenant.middleware.js";
import rbac from "../../middlewares/rbac.middleware.js";
import {
  addCampaign,
  getCampaigns,
  getSingleCampaign,
  updateCampaign,
  updateCampaignStatus,
  updateCampaignMetrics,
  assignCampaign,
  addLeadToCampaign,
  getCampaignAnalytics,
  getMarketingDashboard,
  deleteCampaign,
} from "./campaign.controller.js";

const router = Router();

// Dashboard route
router.get("/dashboard", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), getMarketingDashboard);

// Analytics route
router.get("/analytics", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), getCampaignAnalytics);

// CRUD Operations
router.post("/", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), addCampaign);
router.get("/", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), getCampaigns);
router.get("/:id", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), getSingleCampaign);
router.put("/:id", auth, tenant, rbac(["super_admin", "admin", "manager"]), updateCampaign);
router.delete("/:id", auth, tenant, rbac(["super_admin", "admin"]), deleteCampaign);

// Campaign Management Routes
router.patch("/:id/status", auth, tenant, rbac(["super_admin", "admin", "manager","employee"]), updateCampaignStatus);
router.patch("/:id/metrics", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), updateCampaignMetrics);
router.patch("/:id/assign", auth, tenant, rbac(["super_admin", "admin", "manager"]), assignCampaign);
router.post("/:id/leads", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), addLeadToCampaign);

export default router;
