import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      index: true,
    },

    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    items: [
      {
        description: String,
        quantity: Number,
        rate: Number,
        taxPercent: Number,
        amount: Number,
      },
    ],

    subTotal: Number,
    taxAmount: Number,
    totalAmount: Number,

    paidAmount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid"],
      default: "unpaid",
    },

    dueDate: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
