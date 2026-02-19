import Activity from "./activity.model.js";

/**
 * CREATE ACTIVITY / FOLLOW-UP
 */
export const createActivity = async (req, res, next) => {
  try {
    const activity = await Activity.create({
      ...req.body,
      tenantId: req.user.tenantId,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: activity,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET ACTIVITIES
 * - Sales → own activities
 * - Admin/Manager → all tenant activities
 */
export const getActivities = async (req, res, next) => {
  try {
    const filter = {
      ...req.tenantFilter,
      isDeleted: false,
    };

    if (req.user.role === "sales") {
      filter.assignedTo = req.user.id;
    }

    const activities = await Activity.find(filter)
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      data: activities,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * MARK ACTIVITY COMPLETED
 */
export const completeActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      {
        _id: req.params.id,
        ...req.tenantFilter,
      },
      {
        status: "completed",
        completedAt: new Date(),
      },
      { new: true }
    );

    res.json({
      success: true,
      data: activity,
    });
  } catch (err) {
    next(err);
  }
};