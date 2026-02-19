import bcrypt from "bcrypt";
import User from '../users/user.model.js';

/**
 * CREATE USER
 * - tenantId always comes from JWT
 * - Super Admin can create users for any tenant (optional use)
 * - CEO/Admin create users for their own tenant
 */
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      throw new Error("All fields are required");
    }

    // tenantId logic
    const tenantId =
      req.user.tenantId === null
        ? req.body.tenantId || null // super admin (optional)
        : req.user.tenantId;        // company users

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      tenantId,
      name,
      email,
      password: hashedPassword,
      role,
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, status } = req.body;

    // Build allowed update object
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Hash password if provided
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Role update only by Super Admin
    if (role && req.user.role === "super_admin") {
      updateData.role = role;
    }

    if (status) updateData.status = status;

    // Tenant-based condition
    const filter =
      req.user.tenantId === null
        ? { _id: id } // super admin
        : { _id: id, tenantId: req.user.tenantId }; // company users

    const user = await User.findOneAndUpdate(
      filter,
      updateData,
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });

  } catch (err) {
    next(err);
  }
};


/**
 * GET USERS
 * - Super Admin → all users
 * - Company users → only their company users
 */
export const getUsers = async (req, res, next) => {
  try {
    const filter =
      req.user.tenantId === null
        ? {}
        : { tenantId: req.user.tenantId };

    const users = await User.find(filter).select("-password");

    res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};