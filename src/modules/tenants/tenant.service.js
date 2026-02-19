import Tenant from "./tenant.model.js";

export const createTenant = async (data) => {
  return await Tenant.create(data);
};

export const getAllTenants = async () => {
  return await Tenant.find({ isDeleted: false });
};

export const getTenantById = async (id) => {
  return await Tenant.findById(id);
};
