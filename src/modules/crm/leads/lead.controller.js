import Lead from './lead.model.js';

/**
 * CREATE LEAD
 */
export const createLead = async (req, res, next) => {
  try {
    const lead = await Lead.create({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: lead,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET LEADS
 */
export const getLeads = async (req, res, next) => {
  try {
    const filter = {
      ...req.tenantFilter,
     
      isDeleted: false,
    };

    // Sales exec → only assigned leads
    if (req.user.role === "sales") {
      filter.assignedTo = req.user.id;
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 });

    res.json({ success: true, data: leads });
  } catch (err) {
    next(err);
  }
};

/**
 * ASSIGN LEAD
 */
export const assignLead = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { assignedTo: userId, status: "contacted" },
      { new: true }
    );

    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE LEAD STATUS
 */
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      { status },
      { new: true }
    );

    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};