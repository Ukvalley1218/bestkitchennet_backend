import Campaign from "./campaign.model.js";
import Lead from "../crm/leads/lead.model.js";

/**
 * CREATE CAMPAIGN
 */
export const addCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.create({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: campaign,
      message: "Campaign created successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL CAMPAIGNS WITH FILTERS AND PAGINATION
 */
export const getCampaigns = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      campaign_type,
      campaign_category,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      startDate,
      endDate,
    } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    // Add filters
    if (status) filter.status = status;
    if (campaign_type) filter.campaign_type = campaign_type;
    if (campaign_category) filter.campaign_category = campaign_category;

    // Search functionality
    if (search) {
      filter.$or = [
        { campaign_name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { target_audience: { $regex: search, $options: "i" } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      filter.start_date = {};
      if (startDate) filter.start_date.$gte = new Date(startDate);
      if (endDate) filter.start_date.$lte = new Date(endDate);
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const         campaigns = await Campaign.find(filter)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Campaign.countDocuments(filter);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        per_page: parseInt(limit),
        total_records: total,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET SINGLE CAMPAIGN
 */
export const getSingleCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      isDeleted: false,
    })
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email")
      .populate("leads", "name email phone status source");

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.json({
      success: true,
      data: campaign,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE CAMPAIGN
 */
export const updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantFilter,
        isDeleted: false,
      },
      {
        ...req.body,
        lastModifiedBy: req.user.id,
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.json({
      success: true,
      data: campaign,
      message: "Campaign updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE CAMPAIGN STATUS
 */
export const updateCampaignStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    const campaign = await Campaign.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantFilter,
        isDeleted: false,
      },
      {
        status,
        lastModifiedBy: req.user.id,
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.json({
      success: true,
      data: campaign,
      message: `Campaign ${status.toLowerCase()} successfully`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE CAMPAIGN METRICS
 */
export const updateCampaignMetrics = async (req, res, next) => {
  try {
    const { metrics, spent_amount } = req.body;
    
    const updateData = {
      lastModifiedBy: req.user.id,
    };

    if (metrics) updateData.metrics = metrics;
    if (spent_amount !== undefined) updateData.spent_amount = spent_amount;

    const campaign = await Campaign.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantFilter,
        isDeleted: false,
      },
      updateData,
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.json({
      success: true,
      data: campaign,
      message: "Campaign metrics updated successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ASSIGN CAMPAIGN TO USER
 */
export const assignCampaign = async (req, res, next) => {
  try {
    const { assignedTo } = req.body;
    
    const campaign = await Campaign.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantFilter,
        isDeleted: false,
      },
      {
        assignedTo,
        lastModifiedBy: req.user.id,
      },
      { new: true }
    ).populate("assignedTo", "name email");

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.json({
      success: true,
      data: campaign,
      message: "Campaign assigned successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ADD LEAD TO CAMPAIGN
 */
export const addLeadToCampaign = async (req, res, next) => {
  try {
    const { leadId } = req.body;
    
    const campaign = await Campaign.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantFilter,
        isDeleted: false,
      },
      {
        $addToSet: { leads: leadId },
        $inc: { "metrics.leads_generated": 1 },
        lastModifiedBy: req.user.id,
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.json({
      success: true,
      data: campaign,
      message: "Lead added to campaign successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET CAMPAIGN ANALYTICS
 */
export const getCampaignAnalytics = async (req, res, next) => {
  try {
    const { period = "30d" } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Campaign statistics
    const totalCampaigns = await Campaign.countDocuments(filter);
    const activeCampaigns = await Campaign.countDocuments({ ...filter, status: "Active" });
    const completedCampaigns = await Campaign.countDocuments({ ...filter, status: "Completed" });
    
    // Budget analytics
    const budgetAnalytics = await Campaign.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_budget: { $sum: "$budget" },
          total_spent: { $sum: "$spent_amount" },
          avg_budget: { $avg: "$budget" },
        },
      },
    ]);

    // Performance metrics
    const performanceMetrics = await Campaign.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_impressions: { $sum: "$metrics.impressions" },
          total_clicks: { $sum: "$metrics.clicks" },
          total_conversions: { $sum: "$metrics.conversions" },
          total_leads: { $sum: "$metrics.leads_generated" },
        },
      },
    ]);

    // Campaign by type
    const campaignsByType = await Campaign.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$campaign_type",
          count: { $sum: 1 },
          total_budget: { $sum: "$budget" },
          total_spent: { $sum: "$spent_amount" },
        },
      },
    ]);

    // Campaign by status
    const campaignsByStatus = await Campaign.aggregate([
      { $match: filter },
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
        summary: {
          total_campaigns: totalCampaigns,
          active_campaigns: activeCampaigns,
          completed_campaigns: completedCampaigns,
          completion_rate: totalCampaigns > 0 ? ((completedCampaigns / totalCampaigns) * 100).toFixed(2) : 0,
        },
        budget: budgetAnalytics[0] || {
          total_budget: 0,
          total_spent: 0,
          avg_budget: 0,
        },
        performance: performanceMetrics[0] || {
          total_impressions: 0,
          total_clicks: 0,
          total_conversions: 0,
          total_leads: 0,
        },
        campaigns_by_type: campaignsByType,
        campaigns_by_status: campaignsByStatus,
      },
      period,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET MARKETING DASHBOARD DATA
 */
export const getMarketingDashboard = async (req, res, next) => {
  try {
    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    // Recent campaigns
    const recentCampaigns = await Campaign.find(filter)
      .populate("createdBy", "name")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    // Campaign statistics
    const campaignStats = await Campaign.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total_budget: { $sum: "$budget" },
          total_spent: { $sum: "$spent_amount" },
        },
      },
    ]);

    // Monthly performance
    const monthlyPerformance = await Campaign.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          campaigns: { $sum: 1 },
          budget: { $sum: "$budget" },
          spent: { $sum: "$spent_amount" },
          leads: { $sum: "$metrics.leads_generated" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    // Top performing campaigns
    const topCampaigns = await Campaign.find(filter)
      .sort({ "metrics.conversions": -1, "metrics.roi": -1 })
      .limit(5)
      .populate("createdBy", "name");

    res.json({
      success: true,
      data: {
        recent_campaigns: recentCampaigns,
        campaign_stats: campaignStats,
        monthly_performance: monthlyPerformance,
        top_campaigns: topCampaigns,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE CAMPAIGN (Soft Delete)
 */
export const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantFilter,
        isDeleted: false,
      },
      { 
        isDeleted: true,
        lastModifiedBy: req.user.id,
      },
      { new: true }
    );

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    res.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
