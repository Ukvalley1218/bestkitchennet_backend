import User from "../users/user.model.js";
import CallLog from "./callLog.model.js";


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