import auth from "../../../middlewares/auth.middleware.js";
import tenant from "../../../middlewares/tenant.middleware.js";
import rbac from "../../../middlewares/rbac.middleware.js";
import { createLead,getLeads,updateLeadStatus,assignLead } from "./lead.controller.js";
import { Router } from "express";

const router = Router();

router.post("/", auth, tenant, rbac(["super_admin", "admin","ceo", "manager", "sales"]), createLead);
router.get("/", auth, tenant, rbac(["super_admin", "admin", "manager", "sales"]), getLeads);
router.patch("/:id/assign", auth, tenant, rbac(["admin", "manager"]), assignLead);
router.patch("/:id/status", auth, tenant, rbac(["admin", "manager", "sales"]), updateLeadStatus);

export default router;