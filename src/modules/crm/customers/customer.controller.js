import Customer from "./customer.model.js";
import Lead from "../leads/lead.model.js";


/**
 * MANUAL CUSTOMER CREATION
 */
export const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
      source: "manual",
    });

    res.status(201).json({
      success: true,
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * CONVERT LEAD → CUSTOMER
 */
export const convertLeadToCustomer = async (req, res, next) => {
  try {
    const { leadId } = req.params;

    const lead = await Lead.findOne({
      _id: leadId,
      ...req.tenantFilter,
      isDeleted: false,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    // Check if customer already exists with same email/phone
    let customer = await Customer.findOne({
      tenantId: req.user.tenantId,
      $or: [{ email: lead.email }, { phone: lead.phone }],
      isDeleted: false,
    });

    if (customer) {
      // Attach lead to existing customer
      if (!customer.leadIds.includes(lead._id)) {
        customer.leadIds.push(lead._id);
        await customer.save();
      }
    } else {
      // Create new customer
      customer = await Customer.create({
        tenantId: req.user.tenantId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: "lead",
        leadIds: [lead._id],
        createdBy: req.user.id,
      });
    }

    // Update lead
    lead.status = "quoted";
    lead.customerId = customer._id;
    await lead.save();

    res.json({
      success: true,
      message: "Lead converted to customer",
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET CUSTOMERS
 */
export const getCustomers = async (req, res, next) => {
  try {
    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    const customers = await Customer.find(filter).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      data: customers,
    });
  } catch (err) {
    next(err);
  }
};