import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import tenant from "../../middlewares/tenant.middleware.js";

import { assignLead,startCall,endCall, login } from "./telecalling.controller.js";
import { summary,liveCalls } from "./telecalling.dashboard.controller.js";
import rbac from "../../middlewares/rbac.middleware.js";

const router = Router();


router.post("/login", auth, tenant, login);
router.post("/assign", auth, tenant, rbac(["sales"]),assignLead);
router.post("/start-call", auth, tenant, startCall);
router.post("/end-call", auth, tenant, endCall);

router.get("/dashboard/summary", auth, tenant, summary);
router.get("/dashboard/live-calls", auth, tenant, liveCalls);

export default router;