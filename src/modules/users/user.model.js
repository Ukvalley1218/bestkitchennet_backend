import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    /**
     * SaaS Level
     * null => Super Admin (Platform user)
     * ObjectId => Company user
     */
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      default: null,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: [
        // Platform
        "super_admin",

        // Company Level
        "ceo",
        "admin",
"sales",
        // Staff
        "manager",
        "employee",
        "telecaller",
        "hr",
        "accounts",
        "marketing",
        

      ],
      required: true,
    },
department: String,
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },

    lastLoginAt: {
      type: Date,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdAt: {
  type: Date,
  default: Date.now
}

  },
  { timestamps: true }
);

/**
 * Unique Rules:
 * - Super admin email must be unique globally
 * - Company user email unique per tenant
 */
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: "super_admin",
    },
  }
);

userSchema.index(
  { tenantId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      tenantId: { $ne: null },
    },
  }
);

export default mongoose.model("User", userSchema);
