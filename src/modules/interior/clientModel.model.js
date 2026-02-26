import mongoose from "mongoose";

const clientModelSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },

    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InteriorModel",
      required: true,
      index: true,
    },

    // Customizations for this specific client
    customizations: {
      colorChanges: [
        {
          element: { type: String },
          originalColor: { type: String },
          newColor: { type: String },
        },
      ],
      dimensionChanges: [
        {
          element: { type: String },
          originalValue: { type: Number },
          newValue: { type: Number },
        },
      ],
      additionalNotes: { type: String },
    },

    // Project context
    projectDetails: {
      projectType: {
        type: String,
        enum: ["new", "renovation", "extension"],
        default: "new",
      },
      estimatedBudget: { type: Number },
      targetCompletionDate: { type: Date },
      actualCompletionDate: { type: Date },
    },

    // Status tracking
    status: {
      type: String,
      enum: ["shared", "reviewed", "approved", "in_production", "completed", "cancelled"],
      default: "shared",
      index: true,
    },

    clientFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comments: { type: String, maxlength: 1000 },
      feedbackDate: { type: Date },
    },

    // Shared with client on
    sharedAt: {
      type: Date,
      default: Date.now,
    },

    // Tracking
    viewCount: {
      type: Number,
      default: 0,
    },

    lastViewedAt: {
      type: Date,
    },

    // Conversion tracking
    convertedToOrder: {
      type: Boolean,
      default: false,
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Compound indexes
clientModelSchema.index({ tenantId: 1, customerId: 1 });
clientModelSchema.index({ tenantId: 1, modelId: 1 });
clientModelSchema.index({ tenantId: 1, status: 1 });
clientModelSchema.index({ tenantId: 1, isDeleted: 1 });

export default mongoose.model("ClientModel", clientModelSchema);