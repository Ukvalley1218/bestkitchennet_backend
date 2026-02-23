import mongoose from "mongoose";

const retryQueueSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },

    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },

    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    retryCount: { type: Number, default: 1 },

    nextRetryAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("RetryQueue", retryQueueSchema);