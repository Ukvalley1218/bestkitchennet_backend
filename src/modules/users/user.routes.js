import authMiddleware from "../../middlewares/auth.middleware.js";
import tenantMiddleware from "../../middlewares/tenant.middleware.js";
import rbac from '../../middlewares/rbac.middleware.js';
import { createUser,getUsers,updateUser } from "./user.controller.js";
import { Router } from "express";

const router= Router();

/**
 * CREATE USER
 * Super Admin | CEO | Admin
 */
router.post(
  "/",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "ceo", "admin"]),
  createUser
);

/**
 * GET USERS
 * Super Admin | CEO | Admin
 */
router.get(
  "/",
  authMiddleware,
  tenantMiddleware,
  rbac(["super_admin", "ceo", "admin"]),
  getUsers
);

router.put("/:id",authMiddleware,tenantMiddleware,rbac(["super_admin","ceo","admin"]),updateUser)

export default router;