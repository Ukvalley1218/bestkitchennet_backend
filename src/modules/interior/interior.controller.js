import InteriorModel from "./interior.model.js";
import ClientModel from "./clientModel.model.js";
import { uploadToCloudinary } from "../../services/cloudinary.service.js";
import { generateFolderPath } from "../../utils/fileFolder.util.js";
import { deleteFromCloudinary } from "../../services/cloudinary.service.js";

/**
 * CREATE MODEL
 */
/**
 * CREATE MODEL WITH FILES
 */
export const createModel = async (req, res, next) => {
  try {
    const filesData = [];

    // you also use this logic in other places where you upload files, so can be moved to a service function
    if (req.files && req.files.length > 0) {
      const folder = generateFolderPath({
        tenantId: req.user.tenantId,
        moduleName: "interior",  //change as per module eg "crm/leads" for leads module
        subFolder: "models",   //change this one too
      });

      for (const file of req.files) {
        const result = await uploadToCloudinary(
          file.buffer,
          folder,
          file.mimetype.startsWith("video") ? "video" : "image"
        );

        filesData.push({
          public_id: result.public_id,
          secure_url: result.secure_url,
          format: result.format,
          size: result.bytes,
          original_filename: file.originalname,
          resource_type: result.resource_type,
        });
      }
    }

    const model = await InteriorModel.create({
      ...req.body,
      files: filesData,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "3D Model created successfully",
      data: model,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL MODELS (with pagination, search, filters)
 */
export const getModels = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      spaceType,
      status,
      themeStyle,
      clientType,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    // Search
    if (search) {
      filter.$or = [
        { modelName: { $regex: search, $options: "i" } },
        { modelCode: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    // Filters
    if (spaceType) filter.spaceType = spaceType;
    if (status) filter.status = status;
    if (themeStyle) filter.themeStyle = themeStyle;
    if (clientType) filter.clientType = clientType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [models, total] = await Promise.all([
      InteriorModel.find(filter)
        .populate("createdBy", "name email")
        .populate("approvedBy", "name email")
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      InteriorModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: models,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET SINGLE MODEL
 */
export const getModelById = async (req, res, next) => {
  try {
    const model = await InteriorModel.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      isDeleted: false,
    })
      .populate("createdBy", "name email")
      .populate("approvedBy", "name email")
      .populate("usedInProjects", "name email phone");

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    // Increment view count
    await InteriorModel.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 },
    });

    res.json({
      success: true,
      data: model,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE MODEL
 */
export const updateModel = async (req, res, next) => {
  try {
    const model = await InteriorModel.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      isDeleted: false,
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    // Reset approval status if content is modified
    if (req.body.modelName || req.body.files || req.body.description) {
      req.body.status = "pending_review";
      req.body.isApproved = false;
      req.body.approvedBy = null;
      req.body.approvedAt = null;
    }

    const updatedModel = await InteriorModel.findByIdAndUpdate(
      req.params.id,
      { $set: { ...req.body, updatedBy: req.user.id } },
      { new: true }
    );

    res.json({
      success: true,
      message: "Model updated successfully",
      data: updatedModel,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SOFT DELETE MODEL
 */
export const deleteModel = async (req, res, next) => {
  try {
    const model = await InteriorModel.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      isDeleted: false,
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    // delete model 
    await InteriorModel.findByIdAndUpdate(req.params.id, {
      $set: { isDeleted: true },
    });

    // delete files from cloudinary
    await Promise.all(
  model.files.map((file) =>
    deleteFromCloudinary(file.public_id)
  )
);

    res.json({
      success: true,
      message: "Model deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * APPROVE MODEL (Admin only)
 */
export const approveModel = async (req, res, next) => {
  try {
    const model = await InteriorModel.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      isDeleted: false,
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    const updatedModel = await InteriorModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "approved",
          isApproved: true,
          approvedBy: req.user.id,
          approvedAt: new Date(),
          rejectionReason: null,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Model approved successfully",
      data: updatedModel,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * REJECT MODEL (Admin only)
 */
export const rejectModel = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const model = await InteriorModel.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      isDeleted: false,
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found",
      });
    }

    const updatedModel = await InteriorModel.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "rejected",
          isApproved: false,
          approvedBy: req.user.id,
          approvedAt: new Date(),
          rejectionReason: reason || "Not specified",
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Model rejected",
      data: updatedModel,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================
// CLIENT LINKED MODELS
// ============================================

/**
 * LINK MODEL TO CLIENT
 */
export const linkClient = async (req, res, next) => {
  try {
    const { customerId, modelId, customizations, projectDetails } = req.body;

    // Check if model exists and is approved
    const model = await InteriorModel.findOne({
      _id: modelId,
      ...req.tenantFilter,
      isDeleted: false,
      isApproved: true,
    });

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Model not found or not approved",
      });
    }

    // Check if already linked
    const existingLink = await ClientModel.findOne({
      tenantId: req.user.tenantId,
      customerId,
      modelId,
      isDeleted: false,
    });

    if (existingLink) {
      return res.status(400).json({
        success: false,
        message: "Model already linked to this client",
      });
    }

    const clientModel = await ClientModel.create({
      tenantId: req.user.tenantId,
      customerId,
      modelId,
      customizations,
      projectDetails,
      createdBy: req.user.id,
    });

    // Update model usage
    await InteriorModel.findByIdAndUpdate(modelId, {
      $inc: { usageCount: 1 },
      $addToSet: { usedInProjects: customerId },
    });

    const populatedLink = await ClientModel.findById(clientModel._id)
      .populate("customerId", "name email phone")
      .populate("modelId", "modelName modelCode thumbnail");

    res.status(201).json({
      success: true,
      message: "Model linked to client successfully",
      data: populatedLink,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL CLIENT MODELS
 */
export const getClientModels = async (req, res, next) => {
  try {
    const { customerId, status, page = 1, limit = 10 } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [clientModels, total] = await Promise.all([
      ClientModel.find(filter)
        .populate("customerId", "name email phone")
        .populate("modelId", "modelName modelCode thumbnail spaceType themeStyle")
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ClientModel.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: clientModels,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET SINGLE CLIENT MODEL
 */
export const getClientModelById = async (req, res, next) => {
  try {
    const clientModel = await ClientModel.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      isDeleted: false,
    })
      .populate("customerId", "name email phone companyName")
      .populate("modelId")
      .populate("createdBy", "name email");

    if (!clientModel) {
      return res.status(404).json({
        success: false,
        message: "Client model not found",
      });
    }

    // Increment view count
    await ClientModel.findByIdAndUpdate(req.params.id, {
      $inc: { viewCount: 1 },
      lastViewedAt: new Date(),
    });

    res.json({
      success: true,
      data: clientModel,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE CLIENT MODEL STATUS
 */
export const updateClientModelStatus = async (req, res, next) => {
  try {
    const { status, clientFeedback, projectDetails } = req.body;

    const clientModel = await ClientModel.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      isDeleted: false,
    });

    if (!clientModel) {
      return res.status(404).json({
        success: false,
        message: "Client model not found",
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (clientFeedback) updateData.clientFeedback = clientFeedback;
    if (projectDetails) updateData.projectDetails = projectDetails;

    // Track conversion
    if (status === "completed" || projectDetails?.actualCompletionDate) {
      updateData.convertedToOrder = true;

      // Update model conversion rate
      const totalUsage = await InteriorModel.findById(clientModel.modelId);
      if (totalUsage) {
        const completedCount = await ClientModel.countDocuments({
          modelId: clientModel.modelId,
          status: { $in: ["completed", "approved"] },
          isDeleted: false,
        });
        const totalLinks = await ClientModel.countDocuments({
          modelId: clientModel.modelId,
          isDeleted: false,
        });
        const conversionRate = totalLinks > 0 ? Math.round((completedCount / totalLinks) * 100) : 0;
        await InteriorModel.findByIdAndUpdate(clientModel.modelId, {
          $set: { conversionRate },
        });
      }
    }

    const updated = await ClientModel.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    )
      .populate("customerId", "name email")
      .populate("modelId", "modelName modelCode");

    res.json({
      success: true,
      message: "Client model updated successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================
// DASHBOARD AGGREGATIONS
// ============================================

/**
 * DASHBOARD SUMMARY
 */
export const dashboardSummary = async (req, res, next) => {
  try {
    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    const [
      totalModels,
      approvedModels,
      pendingModels,
      rejectedModels,
      totalViews,
      totalUsage,
      spaceTypeStats,
    ] = await Promise.all([
      InteriorModel.countDocuments(filter),
      InteriorModel.countDocuments({ ...filter, status: "approved" }),
      InteriorModel.countDocuments({ ...filter, status: "pending_review" }),
      InteriorModel.countDocuments({ ...filter, status: "rejected" }),
      InteriorModel.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$viewCount" } } },
      ]),
      InteriorModel.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$usageCount" } } },
      ]),
      InteriorModel.aggregate([
        { $match: filter },
        { $group: { _id: "$spaceType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    // Client models stats
    const clientModelStats = await ClientModel.aggregate([
      { $match: { ...req.tenantFilter, isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        models: {
          total: totalModels,
          approved: approvedModels,
          pending: pendingModels,
          rejected: rejectedModels,
        },
        engagement: {
          totalViews: totalViews[0]?.total || 0,
          totalUsage: totalUsage[0]?.total || 0,
        },
        bySpaceType: spaceTypeStats,
        clientModels: clientModelStats,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * MOST USED MODELS
 */
export const mostUsedModels = async (req, res, next) => {
  try {
    const { limit = 10, spaceType } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
      isApproved: true,
    };

    if (spaceType) filter.spaceType = spaceType;

    const models = await InteriorModel.find(filter)
      .select("modelName modelCode thumbnail usageCount conversionRate viewCount spaceType themeStyle")
      .sort({ usageCount: -1, viewCount: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: models,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * APPROVAL RATE STATS
 */
export const approvalRate = async (req, res, next) => {
  try {
    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    const stats = await InteriorModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const total = stats.reduce((sum, s) => sum + s.count, 0);
    const approved = stats.find((s) => s._id === "approved")?.count || 0;
    const rejected = stats.find((s) => s._id === "rejected")?.count || 0;
    const pending = stats.find((s) => s._id === "pending_review")?.count || 0;
    const draft = stats.find((s) => s._id === "draft")?.count || 0;

    res.json({
      success: true,
      data: {
        total,
        approved,
        rejected,
        pending,
        draft,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        rejectionRate: total > 0 ? Math.round((rejected / total) * 100) : 0,
        breakdown: stats,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * CONVERSION TREND (Monthly Aggregation)
 */
export const conversionTrend = async (req, res, next) => {
  try {
    const { year = new Date().getFullYear() } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    // Models created per month
    const modelsByMonth = await InteriorModel.aggregate([
      {
        $match: {
          ...filter,
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Models approved per month
    const approvedByMonth = await InteriorModel.aggregate([
      {
        $match: {
          ...filter,
          status: "approved",
          approvedAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$approvedAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Client links per month
    const clientLinksByMonth = await ClientModel.aggregate([
      {
        $match: {
          ...req.tenantFilter,
          isDeleted: false,
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Format response for all 12 months
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const trendData = months.map((month, index) => {
      const monthNum = index + 1;
      return {
        month,
        monthNumber: monthNum,
        modelsCreated: modelsByMonth.find((m) => m._id === monthNum)?.count || 0,
        modelsApproved: approvedByMonth.find((m) => m._id === monthNum)?.count || 0,
        clientLinks: clientLinksByMonth.find((m) => m._id === monthNum)?.count || 0,
      };
    });

    res.json({
      success: true,
      data: {
        year: parseInt(year),
        trend: trendData,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SPACE TYPE DISTRIBUTION
 */
export const spaceTypeDistribution = async (req, res, next) => {
  try {
    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    const distribution = await InteriorModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$spaceType",
          count: { $sum: 1 },
          avgUsage: { $avg: "$usageCount" },
          avgViews: { $avg: "$viewCount" },
          avgConversion: { $avg: "$conversionRate" },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: distribution,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * TOP PERFORMING MODELS (by conversion rate)
 */
export const topPerformingModels = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
      isApproved: true,
      usageCount: { $gt: 0 },
    };

    const models = await InteriorModel.find(filter)
      .select("modelName modelCode thumbnail spaceType themeStyle conversionRate usageCount viewCount")
      .sort({ conversionRate: -1, usageCount: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: models,
    });
  } catch (err) {
    next(err);
  }
};