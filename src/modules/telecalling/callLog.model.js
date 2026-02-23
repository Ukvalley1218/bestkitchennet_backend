import mongoose from "mongoose";

const callLogSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },

    leadId: { type: mongoose.Schema.Types.ObjectId, ref: "Lead", required: true },

    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    callType: { type: String, enum: ["inbound", "outbound"], required: true },

    status: { type: String, enum: ["answered", "missed", "rejected"] },

    wasConnected: Boolean,

    reason: String,

    outcome: {
      type: String,
      enum: ["interested", "followup", "not_interested", "not_reachable"],
    },

    duration: Number,

    isLive: { type: Boolean, default: false },

    startedAt: Date,
    endedAt: Date,

    recordingUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model("CallLog", callLogSchema);