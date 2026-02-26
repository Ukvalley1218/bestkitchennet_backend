import { Router } from "express";
import auth from "../../middlewares/auth.middleware.js";
import tenant from "../../middlewares/tenant.middleware.js";
import rbac from "../../middlewares/rbac.middleware.js";
import {
  // Model CRUD
  createModel,
  getModels,
  getModelById,
  updateModel,
  deleteModel,
  approveModel,
  rejectModel,
  // Client Linked
  linkClient,
  getClientModels,
  getClientModelById,
  updateClientModelStatus,
  // Dashboard
  dashboardSummary,
  mostUsedModels,
  approvalRate,
  conversionTrend,
  spaceTypeDistribution,
  topPerformingModels,
} from "./interior.controller.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = Router();

// ============================================
// MODEL CRUD ROUTES
// ============================================

/**
 * @route   POST /api/interior/create-model
 * @desc    Create a new 3D model
 * @access  Admin, Manager, Employee
 */
router.post(
  "/create-model",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager", "employee"]),
  upload.array("files", 10),
  createModel
);

/**
 * @route   GET /api/interior/models
 * @desc    Get all models with pagination and filters
 * @access  All authenticated users
 */
router.get(
  "/models",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager", "employee", "sales"]),
  getModels
);

/**
 * @route   GET /api/interior/model/:id
 * @desc    Get single model by ID
 * @access  All authenticated users
 */
router.get(
  "/model/:id",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager", "employee", "sales"]),
  getModelById
);

/**
 * @route   PUT /api/interior/update-model/:id
 * @desc    Update a model
 * @access  Admin, Manager, Employee
 */
router.put(
  "/update-model/:id",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager", "employee"]),
  updateModel
);

/**
 * @route   DELETE /api/interior/delete-model/:id
 * @desc    Soft delete a model
 * @access  Admin, Manager
 */
router.delete(
  "/delete-model/:id",
  auth,
  tenant,
  rbac(["super_admin", "admin", "manager"]),
  deleteModel
);

/**
 * @route   PATCH /api/interior/approve/:id
 * @desc    Approve a model (Admin only)
 * @access  Admin only
 */
router.patch(
  "/approve/:id",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo"]),
  approveModel
);

/**
 * @route   PATCH /api/interior/reject/:id
 * @desc    Reject a model (Admin only)
 * @access  Admin only
 */
router.patch(
  "/reject/:id",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo"]),
  rejectModel
);

// ============================================
// CLIENT LINKED MODELS ROUTES
// ============================================

/**
 * @route   POST /api/interior/link-client
 * @desc    Link a model to a client
 * @access  Admin, Manager, Sales
 */
router.post(
  "/link-client",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager", "sales"]),
  linkClient
);

/**
 * @route   GET /api/interior/client-models
 * @desc    Get all client-model links
 * @access  Admin, Manager, Sales
 */
router.get(
  "/client-models",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager", "sales"]),
  getClientModels
);

/**
 * @route   GET /api/interior/client-model/:id
 * @desc    Get single client-model link
 * @access  Admin, Manager, Sales
 */
router.get(
  "/client-model/:id",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager", "sales"]),
  getClientModelById
);

/**
 * @route   PATCH /api/interior/client-model/:id
 * @desc    Update client model status/feedback
 * @access  Admin, Manager, Sales
 */
router.patch(
  "/client-model/:id",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager", "sales"]),
  updateClientModelStatus
);

// ============================================
// DASHBOARD ROUTES
// ============================================

/**
 * @route   GET /api/interior/dashboard-summary
 * @desc    Get dashboard summary statistics
 * @access  Admin, Manager
 */
router.get(
  "/dashboard-summary",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager"]),
  dashboardSummary
);

/**
 * @route   GET /api/interior/most-used
 * @desc    Get most used models
 * @access  Admin, Manager, Sales
 */
router.get(
  "/most-used",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager", "sales"]),
  mostUsedModels
);

/**
 * @route   GET /api/interior/approval-rate
 * @desc    Get approval rate statistics
 * @access  Admin, Manager
 */
router.get(
  "/approval-rate",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager"]),
  approvalRate
);

/**
 * @route   GET /api/interior/conversion-trend
 * @desc    Get monthly conversion trend
 * @access  Admin, Manager
 */
router.get(
  "/conversion-trend",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager"]),
  conversionTrend
);

/**
 * @route   GET /api/interior/space-type-distribution
 * @desc    Get distribution by space type
 * @access  Admin, Manager
 */
router.get(
  "/space-type-distribution",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager"]),
  spaceTypeDistribution
);

/**
 * @route   GET /api/interior/top-performing
 * @desc    Get top performing models by conversion rate
 * @access  Admin, Manager
 */
router.get(
  "/top-performing",
  auth,
  tenant,
  rbac(["super_admin", "admin", "ceo", "manager"]),
  topPerformingModels
);

export default router;