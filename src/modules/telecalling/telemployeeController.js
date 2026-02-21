import Lead from "../crm/leads/lead.model.js";
import User from "../users/user.model.js";
import CallLog from "./callLog.model.js";
import RetryQueue from "./retryQueue.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const getMyAssignedLeads = async (req, res, next) => {
  try {
    const leads = await Lead.find({
      tenantId: req.user.tenantId,
      assignedTo: req.user.id,
      leadStage: { $ne: "closed" },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyFollowups = async (req, res, next) => {
  try {
    const today = new Date();

    const leads = await Lead.find({
      tenantId: req.user.tenantId,
      assignedTo: req.user.id,
      leadStage: "followup",
      followUpDate: { $lte: today },
    });

    res.json({
      success: true,
      data: leads,
    });
  } catch (err) {
    next(err);
  }
};

export const getMyRetryQueue = async (req, res, next) => {
  try {
    const retries = await RetryQueue.find({
      tenantId: req.user.tenantId,
      employeeId: req.user.id,
      nextRetryAt: { $lte: new Date() },
    }).populate("leadId");

    res.json({
      success: true,
      data: retries,
    });
  } catch (err) {
    next(err);
  }
};

export const getLeadDetails = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      assignedTo: req.user.id,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (err) {
    next(err);
  }
};