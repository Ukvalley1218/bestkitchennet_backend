import Quotation from "./quotation.model.js";

/**
 * Generate Quote Number
 */
const generateQuoteNumber = () => {
  return `QT-${Date.now()}`;
};

/**
 * CREATE QUOTATION
 */
export const createQuotation = async (req, res, next) => {
  try {
    const {
      items,
      leadId,
      customerId,
      validTill,
    } = req.body;

    let subTotal = 0;
    let taxAmount = 0;

    items.forEach((item) => {
      const itemAmount = item.quantity * item.rate;
      item.amount = itemAmount;
      subTotal += itemAmount;
      taxAmount += (itemAmount * item.taxPercent) / 100;
    });

    const quotation = await Quotation.create({
      tenantId: req.user.tenantId,
      quoteNumber: generateQuoteNumber(),
      leadId,
      customerId,
      items,
      subTotal,
      taxAmount,
      totalAmount: subTotal + taxAmount,
      validTill,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: quotation,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET QUOTATIONS
 */
export const getQuotations = async (req, res, next) => {
  try {
    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    const quotations = await Quotation.find(filter)
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: quotations,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE QUOTATION STATUS (Send / Approve / Reject)
 */
export const updateQuotationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const quotation = await Quotation.findOneAndUpdate(
      { _id: req.params.id, ...req.tenantFilter },
      {
        status,
        $push: {
          approvalLog: {
            action: status,
            userId: req.user.id,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      data: quotation,
    });
  } catch (err) {
    next(err);
  }
};