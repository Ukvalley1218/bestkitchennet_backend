import mongoose from "mongoose";

const tenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // Company Name
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true, // used for subdomain / identification
      lowercase: true,
    },

    email: {
      type: String,
      required: true, // primary admin email
      lowercase: true,
    },

    phone: {
      type: String,
    },

    plan: {
      type: String,
      enum: ["trial", "basic", "pro", "enterprise"],
      default: "trial",
    },

    status: {
      type: String,
      enum: ["active", "suspended", "cancelled"],
      default: "active",
    },

    trialEndsAt: {
      type: Date,
    },  

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

export default mongoose.model("Tenant", tenantSchema);
