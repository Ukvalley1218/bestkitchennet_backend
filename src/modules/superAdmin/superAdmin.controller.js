import Tenant from '../tenants/tenant.model.js';
import User from '../users/user.model.js';
import bcrypt from 'bcrypt';

/**
 * CREATE TENANT + CEO
 * Only Super Admin can do this
 */
export const createCompanyWithCEO = async (req, res, next) => {
  try {
    const {
      companyName,
      companyEmail,
      slug,
      ceoName,
      ceoEmail,
      ceoPassword,
    } = req.body;

    // 1. Create Tenant (Company)
    const tenant = await Tenant.create({
      name: companyName,
      email: companyEmail,
      slug,
      status: "active",
    });

    // 2. Create CEO user
    const hashedPassword = await bcrypt.hash(ceoPassword, 10);

    const ceo = await User.create({
      tenantId: tenant._id,
      name: ceoName,
      email: ceoEmail,
      password: hashedPassword,
      role: "ceo",
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Company and CEO created successfully",
      data: {
        tenant,
        ceo: {
          id: ceo._id,
          email: ceo.email,
          role: ceo.role,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ALL COMPANIES
 */
export const getAllCompanies = async (req, res, next) => {
  try {
    const tenants = await Tenant.find({ isDeleted: false });

    res.json({
      success: true,
      data: tenants,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * SUSPEND / ACTIVATE COMPANY
 */
export const updateCompanyStatus = async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { status } = req.body; // active | suspended

    await Tenant.findByIdAndUpdate(tenantId, { status });

    await User.updateMany(
      { tenantId },
      { status: status === "active" ? "active" : "blocked" }
    );

    res.json({
      success: true,
      message: `Company ${status} successfully`,
    });
  } catch (err) {
    next(err);
  }
};