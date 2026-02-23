import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import tenant from "../../middlewares/tenant.middleware.js";

import { assignLead,startCall,endCall, login, updateMyLead, disposeLead, startShift, takeBreak, resumeWork, logoutShift, getMyReport } from "./telecalling.controller.js";
import { summary,liveCalls } from "./telecalling.controller.js";
import rbac from "../../middlewares/rbac.middleware.js";
import { getLeadDetails, getMyAssignedLeads, getMyFollowups, getMyRetryQueue } from "./telecalling.controller.js";

const router = Router();

// dept head routes 
router.post("/assign", auth, tenant,assignLead);
// dashboard routes
router.get("/dashboard/summary", auth, tenant, summary);
router.get("/dashboard/live-calls", auth, tenant, liveCalls);

// employee routes for get info
router.post("/login", login);
// call routes
router.post("/call/start", auth, tenant, startCall);
router.post("/call/end", auth, tenant, endCall);
router.post("/lead/dispose", auth, tenant, disposeLead);
// activety routes
router.post("/activity/start", auth, tenant, startShift);
router.post("/activity/break", auth, tenant, takeBreak);
router.post("/activity/resume", auth, tenant, resumeWork);
router.post("/activity/logout", auth, tenant, logoutShift);
// employee route
router.get("/reports/my", auth, tenant, getMyReport);

router.get("/my-leads", auth, tenant, getMyAssignedLeads);
router.get("/my-followups", auth, tenant, getMyFollowups);
router.get("/my-retry", auth, tenant, getMyRetryQueue);
router.put("/lead/:id", auth, tenant, updateMyLead);
router.get("/lead/:id", auth, tenant, getLeadDetails);

export default router;