import Lead from "../leads/lead.model.js";
import Invoice from "../invoices/invoice.model.js";
import Payment from "../invoices/payment.model.js";
import Quotation from "../quotations/quotation.model.js";

/**
 * SUMMARY KPI
 */
export const summary = async (req, res, next) => {
  try {
    const filter = getDashboardFilter(req);

    const [
      leadCount,
      invoiceStats,
      paymentStats,
    ] = await Promise.all([
      Lead.countDocuments(filter),

      Invoice.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalInvoiced: { $sum: "$totalAmount" },
            totalCollected: { $sum: "$paidAmount" },
          },
        },
      ]),

      Payment.aggregate([
        { $match: filter },
        { $group: { _id: null, amount: { $sum: "$amountPaid" } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        leads: leadCount,
        invoiced: invoiceStats[0]?.totalInvoiced || 0,
        collected: paymentStats[0]?.amount || 0,
        outstanding:
          (invoiceStats[0]?.totalInvoiced || 0) -
          (paymentStats[0]?.amount || 0),
      },
    });
  } catch (err) {
    next(err);
  }
};

// leads dashboard 
export const leadsDashboard = async (req, res, next) => {
  try {
    const filter = getDashboardFilter(req);

    const leads = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: leads,
    });
  } catch (err) {
    next(err);
  }
};

// follow-ups dashobaord

export const followupsDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    const filter = getDashboardFilter(req);

    const data = await Lead.aggregate([
      {
        $match: {
          ...filter,
          followUpDate: { $exists: true },
        },
      },
      {
        $group: {
          _id: {
            overdue: { $lt: ["$followUpDate", today] },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// revenue dashboard

export const revenueDashboard = async (req, res, next) => {
  try {
    const filter = getDashboardFilter(req);

    const invoices = await Invoice.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          amount: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: invoices,
    });
  } catch (err) {
    next(err);
  }
};

// team performance dashobard 
export const teamDashboard = async (req, res, next) => {
  try {
    const filter = getDashboardFilter(req);

    const data = await Lead.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$createdBy",
          leads: { $sum: 1 },
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
