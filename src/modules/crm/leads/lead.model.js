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
    requirement: String,

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedDepartment: {
  type: String,
  default: "Sales"
},
leadStage: {
  type: String,
  enum: ["new","assigned","followup","retry","interested","closed"],
  default: "new"
},

    nextFollowUpDate: Date,
    remarks: String,
    followUpDate:Date,

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
