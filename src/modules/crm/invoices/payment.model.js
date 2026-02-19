import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    amountPaid: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "cheque"],
      required: true,
    },

    referenceNumber: String,

    paymentDate: {
      type: Date,
      default: Date.now,
    },

    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
