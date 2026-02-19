import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    name: { type: String, required: true },
    email: String,
    phone: String,

    source: {
      type: String,
      enum: ["website", "google_ads", "facebook", "instagram", "whatsapp", "referral", "manual"],
      default: "manual",
    },

    leadType: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "warm",
    },

    status: {
      type: String,
      enum: ["new", "contacted", "quoted", "closed-won", "closed-lost"],
      default: "new",
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    nextFollowUpDate: Date,
    remarks: String,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
