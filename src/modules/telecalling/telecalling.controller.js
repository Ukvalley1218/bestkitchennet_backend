import Lead from "../crm/leads/lead.model.js";
import User from "../users/user.model.js";
import CallLog from "./callLog.model.js";
import RetryQueue from "./retryQueue.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";



export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) throw new Error("User not found");
    if (user.status !== "active") throw new Error("User inactive");

    const match = await bcrypt.compare(password, user.password);
    if (!match) throw new Error("Invalid credentials");

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });
    res.json({ msg:"Login Successful",success: true, token });
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
      department: "Sales",
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
        outcome: req.body.outcome,
      },
      { new: true }
    );

    await handleOutcome(call, req.user);

    res.json({ success: true, data: call });
  } catch (err) {
    next(err);
  }
};

/**
 * OUTCOME ENGINE
 */
const handleOutcome = async (call, user) => {
  const lead = await Lead.findById(call.leadId);

  if (!lead) return;

  switch (call.outcome) {
    case "interested":
      lead.leadStage = "interested";
      break;

    case "followup":
      lead.leadStage = "followup";
      lead.followUpDate = new Date();
      break;

    case "not_reachable":
      lead.leadStage = "retry";
      await RetryQueue.create({
        tenantId: user.tenantId,
        leadId: lead._id,
        employeeId: user.id,
        nextRetryAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      break;

    case "not_interested":
      lead.leadStage = "closed";
      break;
  }

  await lead.save();
};