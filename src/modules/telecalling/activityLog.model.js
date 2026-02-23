import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true },

    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["start", "break", "resume", "logout"],
      required: true,
    },

    description: String,
  },
  { timestamps: true }
);

export default mongoose.model("ActivityLog", activityLogSchema);