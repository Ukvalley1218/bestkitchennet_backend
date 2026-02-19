import * as tenantService from "./tenant.service.js";

export const createTenant = async (req, res, next) => {
  try {
    const tenant = await tenantService.createTenant(req.body);

    res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      data: tenant,
    });
  } catch (error) {
    next(error);
  }
};

export const getTenants = async (req, res, next) => {
  try {
    const tenants = await tenantService.getAllTenants();

    res.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    next(error);
  }
};
