import Lead from "../crm/leads/lead.model.js";
import User from "../users/user.model.js";
import CallLog from "./callLog.model.js";
import RetryQueue from "./retryQueue.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ActivityLog from "./activityLog.model.js";




export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("User not found");
    if (user.status !== "active") throw new Error("User inactive");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid credentials");

     const token = jwt.sign(
          {
            userId: user._id,
            role: user.role,
            tenantId: user.tenantId,
          },
          process.env.JWT_SECRET,
          { expiresIn: "30d" }
        );

    res.json({ msg:"Login Successful",success: true, token });
  } catch (err) {
    next(err);
  }
};




/**
 * SUMMARY
 */
export const summary = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId;

    const totalEmployees = await User.countDocuments({
      tenantId,
      department: "Sales",
    });

    const onCall = await CallLog.countDocuments({
      tenantId,
      isLive: true,
    });

    const activeEmployees = await CallLog.distinct("employeeId", {
      tenantId,
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    const avgDuration = await CallLog.aggregate([
      { $match: { tenantId } },
      { $group: { _id: null, avg: { $avg: "$duration" } } },
    ]);

    res.json({
      success: true,
      data: {
        totalEmployees,
        onCall,
        activeEmployees: activeEmployees.length,
        avgCallDuration: avgDuration[0]?.avg || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * LIVE CALLS
 */
export const liveCalls = async (req, res, next) => {
  try {
    const calls = await CallLog.find({
      tenantId: req.user.tenantId,
      isLive: true,
    }).populate("employeeId leadId");

    res.json({ success: true, data: calls });
  } catch (err) {
    next(err);
  }
};
/**
 * ASSIGN LEAD (Sales Department Only)
 */
export const assignLead = async (req, res, next) => {
  try {
    const { leadId, employeeId } = req.body;

    const employee = await User.findOne({
      _id: employeeId,
      tenantId: req.user.tenantId,
      department: "sales",
    });

    if (!employee) {
      return res.status(400).json({
        success: false,
        message: "Invalid sales employee",
      });
    }

    const lead = await Lead.findOneAndUpdate(
      { _id: leadId, tenantId: req.user.tenantId },
      {
        assignedTo: employeeId,
        leadStage: "assigned",
      },
      { new: true }
    );

    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

/**
 * START CALL (Live Tracking)
 */
export const startCall = async (req, res, next) => {
  try {
    const call = await CallLog.create({
      tenantId: req.user.tenantId,
      leadId: req.body.leadId,
      employeeId: req.user.id,
      callType: req.body.callType,
      isLive: true,
      startedAt: new Date(),
    });

    await Lead.findByIdAndUpdate(req.body.leadId, {
      $inc: { callAttempted: 1 },
      lastCallAt: new Date(),
    });

    res.json({ success: true, data: call });
  } catch (err) {
    next(err);
  }
};

/**
 * END CALL
 */
export const endCall = async (req, res, next) => {
  try {
    const call = await CallLog.findOneAndUpdate(
      {
        _id: req.body.callId,
        employeeId: req.user.id,
      },
      {
        isLive: false,
        endedAt: new Date(),
        duration: req.body.duration,
        status: req.body.status,
        wasConnected: req.body.wasConnected,
      },
      { new: true }
    );

    if (req.body.wasConnected) {
      await Lead.findByIdAndUpdate(call.leadId, {
        $inc: { callConnected: 1 },
      });
    }

    res.json({ success: true, data: call });
  } catch (err) {
    next(err);
  }
};

// dispose lead after call
export const disposeLead = async (req, res, next) => {
  try {
    const {
      leadId,
      callId,
      wasConnected,
      reason,
      stage,
      nextAction,
      disposeRemark,
    } = req.body;

    const lead = await Lead.findOne({
      _id: leadId,
      assignedTo: req.user.id,
      tenantId: req.user.tenantId,
    });

    if (!lead) {
      return res.status(404).json({ success: false });
    }

    // Update CallLog
    await CallLog.findByIdAndUpdate(callId, {
      wasConnected,
      reason,
      outcome: stage,
    });

    // Update Lead
    lead.disposeRemark = disposeRemark;

    if (!wasConnected) {
      lead.leadStage = "retry";

      await RetryQueue.create({
        tenantId: req.user.tenantId,
        leadId: lead._id,
        employeeId: req.user.id,
        nextRetryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
    } else {
      lead.leadStage = stage?.toLowerCase();
    }

    if (nextAction?.followUpDate) {
      lead.followUpDate = nextAction.followUpDate;
      lead.leadStage = "followup";
    }

    if (nextAction?.reassignTo) {
      lead.assignedTo = nextAction.reassignTo;
    }

    await lead.save();

    res.json({ success: true, data: lead });
  } catch (err) {
    next(err);
  }
};

export const getMyReport = async (req, res, next) => {
  try {
    const start = new Date(req.query.date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const calls = await CallLog.find({
      employeeId: req.user.id,
      tenantId: req.user.tenantId,
      createdAt: { $gte: start, $lte: end },
    });

    const activity = await ActivityLog.find({
      employeeId: req.user.id,
      tenantId: req.user.tenantId,
      createdAt: { $gte: start, $lte: end },
    });

    const callAttempted = calls.length;
    const callConnected = calls.filter(c => c.wasConnected).length;
    const notConnected = callAttempted - callConnected;

    const totalCallTime = calls.reduce((sum, c) => sum + (c.duration || 0), 0);

    res.json({
      success: true,
      data: {
        callAttempted,
        callConnected,
        notConnected,
        totalCallTime,
        totalBreaks: activity.filter(a => a.type === "break").length,
        activityLogs: activity,
      },
    });
  } catch (err) {
    next(err);
  }
};


export const updateMyLead = async (req, res, next) => {
  try {
    const { status, leadStage, followUpDate, remarks } = req.body;

    const lead = await Lead.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
      assignedTo: req.user.id,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found or not assigned to you",
      });
    }

    // Only update allowed fields
    if (status) lead.status = status;
    if (leadStage) lead.leadStage = leadStage;
    if (followUpDate) lead.followUpDate = followUpDate;
    if (remarks) lead.remarks = remarks;

    await lead.save();

    res.json({
      success: true,
      data: lead,
    });
  } catch (err) {
    next(err);
  }
};




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


// shift tracking apis , to know when employee is on call and when not, to show live status on dashboard and for managers to track their team
// start call
export const startShift = async (req, res, next) => {
  const log = await ActivityLog.create({
    tenantId: req.user.tenantId,
    employeeId: req.user.id,
    type: "start",
    description: "Shift started",
  });

  res.json({ success: true, data: log });
};
// take a brak
export const takeBreak = async (req, res, next) => {
  const log = await ActivityLog.create({
    tenantId: req.user.tenantId,
    employeeId: req.user.id,
    type: "break",
    description: req.body.reason,
  });

  res.json({ success: true, data: log });
};

// resume work
export const resumeWork = async (req, res, next) => {
  const log = await ActivityLog.create({
    tenantId: req.user.tenantId,
    employeeId: req.user.id,
    type: "resume",
  });

  res.json({ success: true, data: log });
};

// logout
export const logoutShift = async (req, res, next) => {
  const log = await ActivityLog.create({
    tenantId: req.user.tenantId,
    employeeId: req.user.id,
    type: "logout",
  });

  res.json({ success: true, data: log });
};