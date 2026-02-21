import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import tenant from "../../middlewares/tenant.middleware.js";

import { assignLead,startCall,endCall, login } from "./telecalling.controller.js";
import { summary,liveCalls } from "./telecalling.dashboard.controller.js";
import rbac from "../../middlewares/rbac.middleware.js";
import { getLeadDetails, getMyAssignedLeads, getMyFollowups, getMyRetryQueue } from "./telemployeeController.js";

const router = Router();

// dept head routes 
router.post("/assign", auth, tenant,assignLead);
// dashboard routes
router.get("/dashboard/summary", auth, tenant, summary);
router.get("/dashboard/live-calls", auth, tenant, liveCalls);

// employee routes for get info
router.post("/login", login);
router.post("/start-call", auth, tenant, startCall);
router.post("/end-call", auth, tenant, endCall);
router.get("/my-leads", auth, tenant, getMyAssignedLeads);
router.get("/my-followups", auth, tenant, getMyFollowups);
router.get("/my-retry", auth, tenant, getMyRetryQueue);
router.get("/lead/:id", auth, tenant, getLeadDetails);

export default router;