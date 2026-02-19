import Invoice from "./invoice.model.js";
import Payment from "./payment.model.js";
import Quotation from "../quotations/quotation.model.js";


/**
 * Generate Invoice Number
 */
const generateInvoiceNumber = () => {
  return `INV-${Date.now()}`;
};

/**
 * CREATE INVOICE FROM APPROVED QUOTATION
 */
export const createInvoice = async (req, res, next) => {
  try {
    const quotation = await Quotation.findOne({
      _id: req.body.quotationId,
      status: "approved",
      ...req.tenantFilter,
    });

    if (!quotation) {
      return res.status(400).json({
        success: false,
        message: "Quotation not approved or not found",
      });
    }

    const invoice = await Invoice.create({
      tenantId: req.user.tenantId,
      invoiceNumber: generateInvoiceNumber(),
      quotationId: quotation._id,
      customerId: quotation.customerId,
      items: quotation.items,
      subTotal: quotation.subTotal,
      taxAmount: quotation.taxAmount,
      totalAmount: quotation.totalAmount,
      dueDate: req.body.dueDate,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: invoice,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET INVOICES
 */
export const getInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({
      ...req.tenantFilter,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ADD PAYMENT
 */
export const addPayment = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      ...req.tenantFilter,
    });

    if (!invoice) {
      return res.status(404).json({ success: false });
    }

    const payment = await Payment.create({
      tenantId: req.user.tenantId,
      invoiceId: invoice._id,
      amountPaid: req.body.amountPaid,
      paymentMode: req.body.paymentMode,
      referenceNumber: req.body.referenceNumber,
      receivedBy: req.user.id,
    });

    invoice.paidAmount += payment.amountPaid;

    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.status = "paid";
    } else {
      invoice.status = "partially_paid";
    }

    await invoice.save();

    res.json({
      success: true,
      payment,
      invoice,
    });
  } catch (err) {
    next(err);
  }
};