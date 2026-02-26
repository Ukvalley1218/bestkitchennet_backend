import mongoose from "mongoose";

const interiorModelSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    modelName: {
      type: String,
      required: true,
      trim: true,
    },

    modelCode: {
      type: String,
      unique: true,
      sparse: true, // allows null until generated
      index: true,
    },

    spaceType: {
      type: String,
      enum: ["kitchen", "hall", "wardrobe", "bedroom", "bathroom", "office", "custom"],
      required: true,
      index: true,
    },

    layoutType: {
      type: String,
      enum: ["L-shaped", "U-shaped", "parallel", "island", "straight", "corner", "open", "custom"],
      default: "straight",
    },

    themeStyle: {
      type: String,
      enum: ["modern", "contemporary", "traditional", "minimalist", "industrial", "scandinavian", "bohemian", "custom"],
      default: "modern",
    },

    clientType: {
      type: String,
      enum: ["residential", "commercial", "premium", "standard", "luxury"],
      default: "standard",
    },

    colorPalette: {
      primary: { type: String, default: "#FFFFFF" },
      secondary: { type: String, default: "#000000" },
      accent: { type: String },
    },

    dimensions: {
      length: { type: Number },
      width: { type: Number },
      height: { type: Number },
      unit: { type: String, enum: ["ft", "m", "in"], default: "ft" },
    },

    appliancesIncluded: [
      {
        name: { type: String },
        brand: { type: String },
        quantity: { type: Number, default: 1 },
      },
    ],

    materials: [
      {
        type: { type: String },
        finish: { type: String },
        color: { type: String },
      },
    ],

    notes: {
      type: String,
      maxlength: 2000,
    },

    description: {
      type: String,
      maxlength: 5000,
    },

    files: [
      {
        public_id: { type: String, required: true },
        secure_url: { type: String, required: true },
        resource_type: { type: String, enum: ["image", "video", "raw", "3d"], default: "image" },
        format: { type: String },
        size: { type: Number },
        original_filename: { type: String },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    thumbnail: {
      public_id: { type: String },
      secure_url: { type: String },
    },

    status: {
      type: String,
      enum: ["draft", "pending_review", "approved", "rejected"],
      default: "draft",
      index: true,
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      maxlength: 500,
    },

    // Performance Metrics
    conversionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    usageCount: {
      type: Number,
      default: 0,
    },

    viewCount: {
      type: Number,
      default: 0,
    },

    usedInProjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
    ],

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    estimatedCost: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: "INR" },
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

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Compound indexes for efficient queries
interiorModelSchema.index({ tenantId: 1, modelCode: 1 });
interiorModelSchema.index({ tenantId: 1, status: 1 });
interiorModelSchema.index({ tenantId: 1, spaceType: 1 });
interiorModelSchema.index({ tenantId: 1, isDeleted: 1 });
interiorModelSchema.index({ tenantId: 1, createdAt: -1 });

// Pre-save hook to auto-generate modelCode
interiorModelSchema.pre("save", async function (next) {
  if (this.isNew && !this.modelCode) {
    try {
      const count = await this.constructor.countDocuments({
        tenantId: this.tenantId,
      });
      const nextNum = (count + 1).toString().padStart(3, "0");
      this.modelCode = `MDL-${nextNum}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export default mongoose.model("InteriorModel", interiorModelSchema);