import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import tenant from "../../middlewares/tenant.middleware.js";

import { assignLead,startCall,endCall } from "./telecalling.controller.js";
import { summary,liveCalls } from "./telecalling.dashboard.controller.js";

const router = Router();

router.post("/assign", auth, tenant, assignLead);
router.post("/start-call", auth, tenant, startCall);
router.post("/end-call", auth, tenant, endCall);

router.get("/dashboard/summary", auth, tenant, summary);
router.get("/dashboard/live-calls", auth, tenant, liveCalls);

export default router;