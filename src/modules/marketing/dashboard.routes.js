import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import tenant from "../../middlewares/tenant.middleware.js";
import rbac from "../../middlewares/rbac.middleware.js";
import {
  getMarketingDashboardOverview,
  getCampaignPerformanceMetrics,
  getSocialMediaOverview,
  getOnlineMarketingOverview,
  getCampaignLeadsAndActivities,
} from "./dashboard.controller.js";

const router = Router();

// Marketing Dashboard Routes
router.get("/overview", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), getMarketingDashboardOverview);

// Campaign Performance
router.get("/campaign/:campaignId/performance", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), getCampaignPerformanceMetrics);

// Social Media Marketing
router.get("/social-media", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), getSocialMediaOverview);

// Online Marketing
router.get("/online-marketing", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), getOnlineMarketingOverview);

// Campaign Leads and Activities
router.get("/campaign/:campaignId/leads-activities", auth, tenant, rbac(["super_admin", "admin", "manager", "employee"]), getCampaignLeadsAndActivities);

export default router;