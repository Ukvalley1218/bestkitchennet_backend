import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    campaign_name: {
      type: String,
      required: true,
    },

    campaign_type: {
      type: String,
      enum: ["Online", "Offline", "Email", "SMS", "Social Media", "Google Ads", "Facebook Ads"],
      required: true,
    },

    campaign_category: {
      type: String,
      enum: ["Brand Awareness", "Lead Generation", "Sales", "Retention", "Survey"],
      default: "Lead Generation",
    },

    status: {
      type: String,
      enum: ["Draft", "Active", "Paused", "Completed", "Cancelled"],
      default: "Draft",
    },

    budget: {
      type: Number,
      required: true,
    },

    spent_amount: {
      type: Number,
      default: 0,
    },

    target_audience: {
      type: String,
      required: true,
    },

    description: {
      type: String,
    },

    start_date: {
      type: Date,
      required: true,
    },

    end_date: {
      type: Date,
      required: true,
    },

    // Campaign Metrics
    metrics: {
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      leads_generated: { type: Number, default: 0 },
      cost_per_click: { type: Number, default: 0 },
      cost_per_conversion: { type: Number, default: 0 },
      conversion_rate: { type: Number, default: 0 },
      roi: { type: Number, default: 0 },
    },

    // Campaign Settings
    settings: {
      auto_pause_budget: { type: Boolean, default: false },
      budget_alert_threshold: { type: Number, default: 80 },
      daily_budget_limit: { type: Number },
      target_keywords: [String],
      excluded_keywords: [String],
      geographic_targeting: [String],
      age_targeting: {
        min_age: { type: Number, default: 18 },
        max_age: { type: Number, default: 65 },
      },
      gender_targeting: {
        type: String,
        enum: ["All", "Male", "Female"],
        default: "All",
      },
    },

    // Campaign Content
    content: {
      headline: String,
      description: String,
      call_to_action: String,
      landing_page_url: String,
      images: [String],
      videos: [String],
    },

    // Associated Leads
    leads: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
    }],

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
campaignSchema.index({ tenantId: 1, status: 1 });
campaignSchema.index({ tenantId: 1, campaign_type: 1 });
campaignSchema.index({ tenantId: 1, start_date: 1, end_date: 1 });
campaignSchema.index({ tenantId: 1, createdBy: 1 });

// Virtual for campaign duration
campaignSchema.virtual('duration').get(function() {
  if (this.start_date && this.end_date) {
    const diffTime = Math.abs(this.end_date - this.start_date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
  return 0;
});

// Virtual for budget utilization percentage
campaignSchema.virtual('budget_utilization').get(function() {
  return this.budget > 0 ? ((this.spent_amount / this.budget) * 100).toFixed(2) : 0;
});

export default mongoose.model("Campaign", campaignSchema);
