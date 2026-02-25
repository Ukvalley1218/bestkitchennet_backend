export const calculateSaleTotals = (items) => {
  if (!items || items.length === 0) {
    return { subTotal: 0, taxAmount: 0, discountAmount: 0, totalAmount: 0 };
  }

  let subTotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;

  items.forEach((item) => {
    const itemSubTotal = item.quantity * item.rate;
    const itemDiscount = item.discount || 0;
    const itemTax = ((itemSubTotal - itemDiscount) * (item.taxPercent || 0)) / 100;
    const itemTotal = itemSubTotal - itemDiscount + itemTax;

    item.amount = itemTotal;

    subTotal += itemSubTotal;
    totalDiscount += itemDiscount;
    totalTax += itemTax;
  });

  const totalAmount = subTotal - totalDiscount + totalTax;

  return {
    subTotal: parseFloat(subTotal.toFixed(2)),
    taxAmount: parseFloat(totalTax.toFixed(2)),
    discountAmount: parseFloat(totalDiscount.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2)),
  };
};

export const validateSaleItems = (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { valid: false, message: "Items are required and must be a non-empty array" };
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item.productName || item.productName.trim() === "") {
      return { valid: false, message: `Item ${i + 1}: Product name is required` };
    }
    if (!item.quantity || item.quantity <= 0) {
      return { valid: false, message: `Item ${i + 1}: quantity should be > 0` };
    }
    if (!item.rate || item.rate < 0) {
      return { valid: false, message: `Item ${i + 1}: rate must be non-negative` };
    }
  }

  return { valid: true };
};

export const generateSaleReport = (sales) => {
  if (!sales || sales.length === 0) {
    return {
      totalSales: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      topProducts: [],
      salesByStatus: {},
      salesByPaymentStatus: {},
    };
  }

  let totalRevenue = 0;
  const productMap = new Map();
  const statusMap = new Map();
  const paymentStatusMap = new Map();

  sales.forEach((sale) => {
    totalRevenue += sale.totalAmount;

    statusMap.set(sale.status, (statusMap.get(sale.status) || 0) + 1);
    paymentStatusMap.set(
      sale.paymentStatus,
      (paymentStatusMap.get(sale.paymentStatus) || 0) + 1
    );

    sale.items.forEach((item) => {
      const existing = productMap.get(item.productName) || {
        name: item.productName,
        quantity: 0,
        revenue: 0,
      };
      existing.quantity += item.quantity;
      existing.revenue += item.amount;
      productMap.set(item.productName, existing);
    });
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return {
    totalSales: sales.length,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    avgOrderValue: parseFloat((totalRevenue / sales.length).toFixed(2)),
    topProducts,
    salesByStatus: Object.fromEntries(statusMap),
    salesByPaymentStatus: Object.fromEntries(paymentStatusMap),
  };
};

export const canCancelSale = (sale) => {
  if (!sale) {
    return { allowed: false, reason: "Sale not found" };
  }

  if (sale.isDeleted) {
    return { allowed: false, reason: "Sale is already deleted" };
  }

  if (sale.status === "cancelled") {
    return { allowed: false, reason: "Sale is already cancelled" };
  }

  if (sale.status === "delivered") {
    return { allowed: false, reason: "Cannot cancel delivered sale" };
  }

  if (sale.paymentStatus === "paid") {
    return {
      allowed: false,
      reason: "Cannot cancel fully paid sale. Please process refund first",
    };
  }

  return { allowed: true };
};

export const calculateDashboardMetrics = (sales, startDate, endDate) => {
  const filteredSales = sales.filter((sale) => {
    if (!startDate && !endDate) return true;
    const saleDate = new Date(sale.orderDate);
    if (startDate && saleDate < new Date(startDate)) return false;
    if (endDate && saleDate > new Date(endDate)) return false;
    return true;
  });

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalPaid = filteredSales.reduce((sum, sale) => sum + sale.paidAmount, 0);
  const totalPending = filteredSales.reduce((sum, sale) => sum + sale.balanceAmount, 0);

  const pendingSales = filteredSales.filter((s) => s.status === "pending").length;
  const confirmedSales = filteredSales.filter((s) => s.status === "confirmed").length;
  const processingSales = filteredSales.filter((s) => s.status === "processing").length;
  const shippedSales = filteredSales.filter((s) => s.status === "shipped").length;
  const deliveredSales = filteredSales.filter((s) => s.status === "delivered").length;
  const cancelledSales = filteredSales.filter((s) => s.status === "cancelled").length;

  return {
    totalSales: filteredSales.length,
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalPaid: parseFloat(totalPaid.toFixed(2)),
    totalPending: parseFloat(totalPending.toFixed(2)),
    avgOrderValue:
      filteredSales.length > 0
        ? parseFloat((totalRevenue / filteredSales.length).toFixed(2))
        : 0,
    statusBreakdown: {
      pending: pendingSales,
      confirmed: confirmedSales,
      processing: processingSales,
      shipped: shippedSales,
      delivered: deliveredSales,
      cancelled: cancelledSales,
    },
    conversionRate:
      pendingSales + confirmedSales > 0
        ? parseFloat(((deliveredSales / (pendingSales + confirmedSales)) * 100).toFixed(2))
        : 0,
  };
};
