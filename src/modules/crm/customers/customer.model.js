import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      index: true,
    },

    phone: {
      type: String,
      index: true,
    },

    companyName: String,

    billingAddress: String,
    shippingAddress: String,

    gstin: String,
    pan: String,

    source: {
      type: String,
      enum: ["lead", "manual"],
      default: "manual",
    },

    leadIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lead",
      },
    ],

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

export default mongoose.model("Customer", customerSchema);
