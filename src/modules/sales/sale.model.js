import mongoose from "mongoose";

const saleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },

    saleNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    customerName: {
      type: String,
      required: true,
    },

    customerPhone: String,
    customerEmail: String,
    customerAddress: String,

    items: [
      {
        productName: {
          type: String,
          required: true,
        },
        description: String,
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        rate: {
          type: Number,
          required: true,
          min: 0,
        },
        taxPercent: {
          type: Number,
          default: 0,
          min: 0,
        },
        discount: {
          type: Number,
          default: 0,
          min: 0,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],

    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    paidAmount: {
      type: Number,
      default: 0,
    },

    balanceAmount: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "partially_paid", "paid"],
      default: "unpaid",
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    orderDate: {
      type: Date,
      default: Date.now,
    },

    expectedDeliveryDate: Date,
    actualDeliveryDate: Date,

    paymentMode: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer", "cheque", "other"],
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    notes: String,
    remarks: String,

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
    },

    quotationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quotation",
    },

    source: {
      type: String,
      enum: ["website", "store", "phone", "whatsapp", "email", "social_media", "referral", "other"],
      default: "store",
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
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

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

saleSchema.pre("validate", async function () {
  if (!this.saleNumber) {
    const count = await mongoose.model("Sale").countDocuments();
    this.saleNumber = `SALE-${Date.now()}-${count + 1}`;
  }
});

saleSchema.pre("save", function () {
  this.balanceAmount = this.totalAmount - this.paidAmount;
});

export default mongoose.model("Sale", saleSchema);
