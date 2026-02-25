import Sale from "./sale.model.js";
import { calculateSaleTotals } from "./sale.service.js";

export const createSale = async (req, res, next) => {
  try {
    const { items, ...saleData } = req.body;
    const totals = calculateSaleTotals(items);

    const sale = await Sale.create({
      ...saleData,
      items,
      ...totals,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
      balanceAmount: totals.totalAmount - (saleData.paidAmount || 0),
    });

    res.status(201).json({
      success: true,
      message: "Sale created",
      data: sale,
    });
  } catch (err) {
    next(err);
  }
};

export const getSales = async (req, res, next) => {
  try {
    const { status, paymentStatus, startDate, endDate, customerId, assignedTo } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (customerId) filter.customerId = customerId;
    if (assignedTo) filter.assignedTo = assignedTo;

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    if (req.user.role === "sales") {
      filter.assignedTo = req.user.id;
    }

    console.log('sales filter used', filter);

    const sales = await Sale.find(filter)
      .populate("customerId", "name email phone")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: sales.length, data: sales });
  } catch (err) {
    next(err);
  }
};

export const getSaleById = async (req, res, next) => {
  try {
    const sale = await Sale.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      isDeleted: false,
    })
      .populate("customerId", "name email phone address")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("invoiceId")
      .populate("quotationId");

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.json({
      success: true,
      data: sale,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSale = async (req, res, next) => {
  try {
    const { items, ...updateData } = req.body;

    let totals = {};
    if (items) {
      totals = calculateSaleTotals(items);
      updateData.items = items;
    }

    const sale = await Sale.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantFilter,
        isDeleted: false,
      },
      {
        ...updateData,
        ...totals,
        updatedBy: req.user.id,
      },
      { new: true, runValidators: true }
    );

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.json({
      success: true,
      message: "Sale updated successfully",
      data: sale,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSaleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updateData = { status, updatedBy: req.user.id };

    if (status === "delivered") updateData.actualDeliveryDate = new Date();

    const sale = await Sale.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter, isDeleted: false },
      updateData,
      { new: true }
    );

    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale not found" });
    }

    res.json({ success: true, message: "Status changed", data: sale });
  } catch (err) {
    next(err);
  }
};

export const updatePayment = async (req, res, next) => {
  try {
    const { paidAmount, paymentMode } = req.body;

    const sale = await Sale.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
      isDeleted: false,
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    sale.paidAmount += Number(paidAmount);
    sale.balanceAmount = sale.totalAmount - sale.paidAmount;

    if (sale.paidAmount >= sale.totalAmount) {
      sale.paymentStatus = "paid";
    } else if (sale.paidAmount > 0) {
      sale.paymentStatus = "partially_paid";
    } else {
      sale.paymentStatus = "unpaid";
    }

    if (paymentMode) {
      sale.paymentMode = paymentMode;
    }

    sale.updatedBy = req.user.id;
    await sale.save();

    res.json({
      success: true,
      message: "Payment updated successfully",
      data: sale,
    });
  } catch (err) {
    next(err);
  }
};

export const assignSale = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const sale = await Sale.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantFilter,
        isDeleted: false,
      },
      {
        assignedTo: userId,
        updatedBy: req.user.id,
      },
      { new: true }
    ).populate("assignedTo", "name email");

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.json({
      success: true,
      message: "Sale assigned successfully",
      data: sale,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteSale = async (req, res, next) => {
  try {
    const sale = await Sale.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantFilter,
        isDeleted: false,
      },
      {
        isDeleted: true,
        updatedBy: req.user.id,
      },
      { new: true }
    );

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    res.json({
      success: true,
      message: "Sale deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getSalesStats = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate);
      if (endDate) filter.orderDate.$lte = new Date(endDate);
    }

    const stats = await Sale.aggregate([
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
    ]);

    const statusStats = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    const paymentStats = await Sale.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        overall: stats[0] || {
          totalSales: 0,
          totalRevenue: 0,
          totalPaid: 0,
          totalPending: 0,
          avgOrderValue: 0,
        },
        byStatus: statusStats,
        byPaymentStatus: paymentStats,
      },
    });
  } catch (err) {
    next(err);
  }
};
