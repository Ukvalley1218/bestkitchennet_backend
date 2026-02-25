import Sale from "./sale.model.js";
import { calculateDashboardMetrics } from "./sale.service.js";

export const getSalesDashboard = async (req, res, next) => {
  try {
    const { startDate, endDate, status, paymentStatus } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const [salesStats, statusBreakdown, paymentBreakdown, recentSales] = await Promise.all([
      Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalRevenue: { $sum: "$totalAmount" },
            totalPaid: { $sum: "$paidAmount" },
            totalPending: { $sum: "$balanceAmount" },
            avgOrderValue: { $avg: "$totalAmount" },
          },
        },
      ]),

      Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
      ]),

      Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
            totalAmount: { $sum: "$totalAmount" },
            paidAmount: { $sum: "$paidAmount" },
            pendingAmount: { $sum: "$balanceAmount" },
          },
        },
      ]),

      Sale.find(filter)
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("customerId", "name email phone")
        .populate("assignedTo", "name email"),
    ]);

    res.json({
      success: true,
      data: {
        summary: salesStats[0] || { totalSales: 0, totalRevenue: 0, totalPaid: 0, totalPending: 0, avgOrderValue: 0 },
        statusBreakdown,
        paymentBreakdown,
        recentSales,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSalesTrends = async (req, res, next) => {
  try {
    const { period = "daily", startDate, endDate } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    let groupBy;
    switch (period) {
      case "monthly":
        groupBy = { year: { $year: "$orderDate" }, month: { $month: "$orderDate" } };
        break;
      case "weekly":
        groupBy = { year: { $year: "$orderDate" }, week: { $week: "$orderDate" } };
        break;
      case "daily":
      default:
        groupBy = { year: { $year: "$orderDate" }, month: { $month: "$orderDate" }, day: { $dayOfMonth: "$orderDate" } };
        break;
    }

    const trends = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json({ success: true, data: trends });
  } catch (err) {
    next(err);
  }
};

export const getTopProducts = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const topProducts = await Sale.aggregate([
      { $match: filter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productName",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.amount" },
          salesCount: { $sum: 1 },
          avgPrice: { $avg: "$items.rate" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.json({ success: true, data: topProducts });
  } catch (err) {
    next(err);
  }
};

export const getTopCustomers = async (req, res, next) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const topCustomers = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$customerId",
          customerName: { $first: "$customerName" },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          totalPaid: { $sum: "$paidAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit) },
    ]);

    res.json({ success: true, data: topCustomers });
  } catch (err) {
    next(err);
  }
};

export const getSalesPerformance = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
      assignedTo: { $exists: true, $ne: null },
    };

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const performance = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$assignedTo",
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
          deliveredSales: {
            $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          userId: "$_id",
          userName: "$user.name",
          userEmail: "$user.email",
          totalSales: 1,
          totalRevenue: 1,
          avgOrderValue: 1,
          deliveredSales: 1,
          conversionRate: {
            $cond: [
              { $gt: ["$totalSales", 0] },
              {
                $multiply: [{ $divide: ["$deliveredSales", "$totalSales"] }, 100],
              },
              0,
            ],
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    res.json({
      success: true,
      data: performance,
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingDeliveries = async (req, res, next) => {
  try {
    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
      status: { $in: ["confirmed", "processing", "shipped"] },
    };

    const pendingDeliveries = await Sale.find(filter)
      .sort({ expectedDeliveryDate: 1 })
      .populate("customerId", "name phone email")
      .populate("assignedTo", "name email")
      .select(
        "saleNumber customerName status expectedDeliveryDate totalAmount items"
      );

    const today = new Date();
    const categorized = {
      overdue: [],
      today: [],
      upcoming: [],
    };

    pendingDeliveries.forEach((sale) => {
      if (!sale.expectedDeliveryDate) {
        categorized.upcoming.push(sale);
      } else {
        const deliveryDate = new Date(sale.expectedDeliveryDate);
        if (deliveryDate < today) {
          categorized.overdue.push(sale);
        } else if (
          deliveryDate.toDateString() === today.toDateString()
        ) {
          categorized.today.push(sale);
        } else {
          categorized.upcoming.push(sale);
        }
      }
    });

    res.json({
      success: true,
      data: categorized,
    });
  } catch (err) {
    next(err);
  }
};
