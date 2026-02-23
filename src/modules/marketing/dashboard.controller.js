import Campaign from "./campaign.model.js";
import Lead from "../crm/leads/lead.model.js";

/**
 * GET MARKETING DASHBOARD OVERVIEW
 */
export const getMarketingDashboardOverview = async (req, res, next) => {
  try {
    const { period = "30d" } = req.query;
    
    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
      createdAt: { $gte: startDate, $lte: endDate },
    };

    // Campaign Overview Statistics
    const campaignStats = await Campaign.aggregate([
      { $match: { ...req.tenantFilter, isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total_budget: { $sum: "$budget" },
          total_spent: { $sum: "$spent_amount" },
          total_leads: { $sum: "$metrics.leads_generated" },
          total_conversions: { $sum: "$metrics.conversions" },
        },
      },
    ]);

    // Recent Campaign Performance
    const recentCampaignPerformance = await Campaign.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total_impressions: { $sum: "$metrics.impressions" },
          total_clicks: { $sum: "$metrics.clicks" },
          total_conversions: { $sum: "$metrics.conversions" },
          total_spent: { $sum: "$spent_amount" },
          total_budget: { $sum: "$budget" },
          avg_ctr: { $avg: { $divide: ["$metrics.clicks", "$metrics.impressions"] } },
          avg_conversion_rate: { $avg: "$metrics.conversion_rate" },
        },
      },
    ]);

    // Top Performing Campaigns
    const topCampaigns = await Campaign.find({
      ...req.tenantFilter,
      isDeleted: false,
      status: "Active",
    })
      .sort({ "metrics.roi": -1 })
      .limit(5)
      .populate("createdBy", "name")
      .select("campaign_name campaign_type budget spent_amount metrics");

    // Campaign by Type Distribution
    const campaignTypeDistribution = await Campaign.aggregate([
      { $match: { ...req.tenantFilter, isDeleted: false } },
      {
        $group: {
          _id: "$campaign_type",
          count: { $sum: 1 },
          total_budget: { $sum: "$budget" },
          total_spent: { $sum: "$spent_amount" },
          total_leads: { $sum: "$metrics.leads_generated" },
        },
      },
    ]);

    // Monthly Campaign Trends
    const monthlyCampaignTrends = await Campaign.aggregate([
      { $match: { ...req.tenantFilter, isDeleted: false } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          campaigns_created: { $sum: 1 },
          total_budget: { $sum: "$budget" },
          total_spent: { $sum: "$spent_amount" },
          total_leads: { $sum: "$metrics.leads_generated" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]);

    // Marketing ROI Calculation
    const roiCalculation = await Campaign.aggregate([
      { $match: { ...req.tenantFilter, isDeleted: false } },
      {
        $group: {
          _id: null,
          total_investment: { $sum: "$spent_amount" },
          total_conversions: { $sum: "$metrics.conversions" },
          avg_conversion_value: { $avg: 100 }, // Assuming 100 as avg conversion value
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        period,
        campaign_stats: campaignStats,
        performance: recentCampaignPerformance[0] || {
          total_impressions: 0,
          total_clicks: 0,
          total_conversions: 0,
          total_spent: 0,
          total_budget: 0,
          avg_ctr: 0,
          avg_conversion_rate: 0,
        },
        top_campaigns: topCampaigns,
        campaign_type_distribution: campaignTypeDistribution,
        monthly_trends: monthlyCampaignTrends,
        roi: roiCalculation[0] || {
          total_investment: 0,
          total_conversions: 0,
          avg_conversion_value: 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET CAMPAIGN PERFORMANCE METRICS
 */
export const getCampaignPerformanceMetrics = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { period = "30d" } = req.query;

    const campaign = await Campaign.findOne({
      _id: campaignId,
      ...req.tenantFilter,
      isDeleted: false,
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Calculate performance metrics
    const metrics = {
      impressions: campaign.metrics.impressions || 0,
      clicks: campaign.metrics.clicks || 0,
      conversions: campaign.metrics.conversions || 0,
      leads_generated: campaign.metrics.leads_generated || 0,
      budget_utilization: campaign.budget > 0 ? ((campaign.spent_amount / campaign.budget) * 100).toFixed(2) : 0,
      ctr: campaign.metrics.impressions > 0 ? ((campaign.metrics.clicks / campaign.metrics.impressions) * 100).toFixed(2) : 0,
      conversion_rate: campaign.metrics.clicks > 0 ? ((campaign.metrics.conversions / campaign.metrics.clicks) * 100).toFixed(2) : 0,
      cost_per_click: campaign.metrics.clicks > 0 ? (campaign.spent_amount / campaign.metrics.clicks).toFixed(2) : 0,
      cost_per_conversion: campaign.metrics.conversions > 0 ? (campaign.spent_amount / campaign.metrics.conversions).toFixed(2) : 0,
      roi: campaign.spent_amount > 0 ? (((campaign.metrics.conversions * 100) - campaign.spent_amount) / campaign.spent_amount * 100).toFixed(2) : 0,
    };

    res.json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.campaign_name,
          type: campaign.campaign_type,
          status: campaign.status,
          budget: campaign.budget,
          spent: campaign.spent_amount,
        },
        metrics,
        period,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET SOCIAL MEDIA MARKETING OVERVIEW
 */
export const getSocialMediaOverview = async (req, res, next) => {
  try {
    const socialMediaTypes = ["Social Media", "Facebook Ads", "Instagram", "Twitter"];
    
    const socialCampaigns = await Campaign.find({
      ...req.tenantFilter,
      isDeleted: false,
      campaign_type: { $in: socialMediaTypes },
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    const socialStats = await Campaign.aggregate([
      { 
        $match: { 
          ...req.tenantFilter, 
          isDeleted: false, 
          campaign_type: { $in: socialMediaTypes } 
        } 
      },
      {
        $group: {
          _id: "$campaign_type",
          count: { $sum: 1 },
          total_budget: { $sum: "$budget" },
          total_spent: { $sum: "$spent_amount" },
          total_impressions: { $sum: "$metrics.impressions" },
          total_clicks: { $sum: "$metrics.clicks" },
          total_conversions: { $sum: "$metrics.conversions" },
          total_leads: { $sum: "$metrics.leads_generated" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        social_campaigns: socialCampaigns,
        social_stats: socialStats,
        summary: {
          total_social_campaigns: socialCampaigns.length,
          active_social_campaigns: socialCampaigns.filter(c => c.status === "Active").length,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ONLINE MARKETING OVERVIEW
 */
export const getOnlineMarketingOverview = async (req, res, next) => {
  try {
    const onlineTypes = ["Online", "Google Ads", "Email", "Social Media", "Facebook Ads"];
    
    const onlineCampaigns = await Campaign.find({
      ...req.tenantFilter,
      isDeleted: false,
      campaign_type: { $in: onlineTypes },
    })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    const onlineStats = await Campaign.aggregate([
      { 
        $match: { 
          ...req.tenantFilter, 
          isDeleted: false, 
          campaign_type: { $in: onlineTypes } 
        } 
      },
      {
        $group: {
          _id: null,
          total_campaigns: { $sum: 1 },
          total_budget: { $sum: "$budget" },
          total_spent: { $sum: "$spent_amount" },
          total_impressions: { $sum: "$metrics.impressions" },
          total_clicks: { $sum: "$metrics.clicks" },
          total_conversions: { $sum: "$metrics.conversions" },
          total_leads: { $sum: "$metrics.leads_generated" },
          avg_ctr: { $avg: { $divide: ["$metrics.clicks", "$metrics.impressions"] } },
          avg_conversion_rate: { $avg: "$metrics.conversion_rate" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        online_campaigns: onlineCampaigns,
        online_stats: onlineStats[0] || {},
        campaign_performance_by_type: await Campaign.aggregate([
          { 
            $match: { 
              ...req.tenantFilter, 
              isDeleted: false, 
              campaign_type: { $in: onlineTypes } 
            } 
          },
          {
            $group: {
              _id: "$campaign_type",
              count: { $sum: 1 },
              avg_roi: { $avg: "$metrics.roi" },
              total_conversions: { $sum: "$metrics.conversions" },
            },
          },
          { $sort: { avg_roi: -1 } },
        ]),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET CAMPAIGN LEADS AND ACTIVITIES
 */
export const getCampaignLeadsAndActivities = async (req, res, next) => {
  try {
    const { campaignId } = req.params;

    const campaign = await Campaign.findOne({
      _id: campaignId,
      ...req.tenantFilter,
      isDeleted: false,
    }).populate({
      path: "leads",
      select: "name email phone status source createdAt",
      options: { sort: { createdAt: -1 } },
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Get campaign-related activities (you may need to create this based on your activity model)
    // const activities = await Activity.find({
    //   campaignId: campaignId,
    //   ...req.tenantFilter,
    // }).sort({ createdAt: -1 }).limit(20);

    res.json({
      success: true,
      data: {
        campaign: {
          id: campaign._id,
          name: campaign.campaign_name,
          type: campaign.campaign_type,
        },
        leads: campaign.leads || [],
        lead_statistics: {
          total_leads: campaign.leads?.length || 0,
          new_leads: campaign.leads?.filter(lead => lead.status === "new").length || 0,
          contacted_leads: campaign.leads?.filter(lead => lead.status === "contacted").length || 0,
          converted_leads: campaign.leads?.filter(lead => lead.status === "closed-won").length || 0,
        },
        // activities: activities || [],
      },
    });
  } catch (err) {
    next(err);
  }
};