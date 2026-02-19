import { Router } from "express";
import tenantRoutes from '../modules/tenants/tenant.routes.js';
const router = Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "Best Kitchenettes SaaS Backend",
    timestamp: new Date(),
  });
});

router.use("/tenants", tenantRoutes);

export default router;
