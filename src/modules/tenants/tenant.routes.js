import { Router } from "express";
import { createTenant, getTenants } from "./tenant.controller.js";

const router = Router();

router.post("/", createTenant);
router.get("/", getTenants);


export default router;
