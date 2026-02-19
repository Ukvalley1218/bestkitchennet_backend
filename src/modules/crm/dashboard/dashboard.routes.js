import { Router } from "express";
import authMiddleware from "../../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../../middlewares/tenant.middleware.js";
import { summary,leadsDashboard,followupsDashboard,revenueDashboard,teamDashboard } from "./dashboard.controller.js";

const router = Router();


router.get("/summary", authMiddleware, tenantMiddleware, summary);
router.get("/leads", authMiddleware, tenantMiddleware, leadsDashboard);
router.get("/followups", authMiddleware, tenantMiddleware, followupsDashboard);
router.get("/revenue", authMiddleware, tenantMiddleware, revenueDashboard);
router.get("/team", authMiddleware, tenantMiddleware, teamDashboard);

export default router;